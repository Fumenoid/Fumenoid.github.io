---
layout: post
title: "TryHackMe - CMesS"
description: "Walkthrough of CMess room on TryHackMe."
thumb_image: "documentation/cmessthumb.png"
tags: [ tryhackme ]
---

{% include image.html path="documentation/cmess.webp"
path-detail="documentation/cmess.webp"
alt="THM CMesS" %}

## THM - CMesS

IP - 10.10.255.20

### Overview

This is a medium level room on THM by [Optional](https://twitter.com/optionalctf), it starts with bruteforcing subdomains to find a `dev` domain, where we find creds of the Gila cms admin pannel, then next step was to upload a php revshell to get shell on box. User was basic enumeration, to find a password backup file but root was interesting and was about `cronjobs` and `Wildcard injection`, in the end I learned something new and usefull.

### Enumeration

As always let’s start off with nmap script nmap -sC for default scripts ~~Alright, if it isn’t obvious yet I am a IPPSEC fanboi.~~ Aight, firing up nmap to scan all open ports on the box.

{% highlight bash %}
nmap -sC -sV -oA nmap/results 10.10.255.20
{% endhighlight %} 
And here is our nmap result
{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Pentest/THM/CMESS]
└──╼ $cat nmap/result 
# Nmap 7.80 scan initiated Mon Jul 20 16:40:04 2020 as: nmap -sC -sV -o nmap/result 10.10.255.20
Nmap scan report for 10.10.79.57
Host is up (0.21s latency).
Not shown: 997 closed ports
PORT     STATE    SERVICE   VERSION
22/tcp   open     ssh       OpenSSH 7.2p2 Ubuntu 4ubuntu2.8 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   2048 d9:b6:52:d3:93:9a:38:50:b4:23:3b:fd:21:0c:05:1f (RSA)
|   256 21:c3:6e:31:8b:85:22:8a:6d:72:86:8f:ae:64:66:2b (ECDSA)
|_  256 5b:b9:75:78:05:d7:ec:43:30:96:17:ff:c6:a8:6c:ed (ED25519)
80/tcp   open     http      Apache httpd 2.4.18 ((Ubuntu))
|_http-generator: Gila CMS
| http-robots.txt: 3 disallowed entries 
|_/src/ /themes/ /lib/
|_http-server-header: Apache/2.4.18 (Ubuntu)
|_http-title: Site doesnt have a title (text/html; charset=UTF-8).
9101/tcp filtered jetdirect
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
# Nmap done at Mon Jul 20 16:40:47 2020 -- 1 IP address (1 host up) scanned in 42.98 seconds
{% endhighlight %}

Alright, I guess our attack would be on webserver which is running on port 80.

### Enumeration

As soon as we open the website we can see it’s using Gila cms, though we can’t find any version information. So launching a gobuster scan.. on enum a little we can see it’s a simple blog post site.

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Pentest/THM/CMESS]
└──╼ $gobuster dir -u http://10.10.255.20 -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -x txt,php -t 60 -o goscan
{% endhighlight %} 

Gobuster gave a lot of false positive for me, but it located `/admin` directory which redirected us to a login page but it needed creds, the box creator [Optional](https://twitter.com/optionalctf) mentioned that the box doesn’t require brute forcing which was unique for a thm box. Anyway so I started enumerating more but got nothing, in the end i saw the hint for user flag.

{% highlight bash %}
Have you tried fuzzing for subdomains?
{% endhighlight %} 

And I realised I missed the note to add ip as `cmess.thm` in `/etc/hosts`, so after adding it in I started to look for subdomains. I did it using `turbo intruder` which is a burp suite extension, though you can also use gobuster or ffuf for it but I will cover `turbo intruder` for this writeup. _Thanks `pop_eax` for telling me about it._

Alright so first step is to intercept the request of `http://cmess.thm` on burp and send it to repeater, on repeater tab add a `%s` on the location you wanna fuzz. 

{% include image.html path="documentation/cmessrepeater.webp"
path-detail="documentation/cmessrepeater.webp"
alt="THM CMesS" %}
Now right click on request > send to turbo intruder
{% include image.html path="documentation/cmessturbointruder.webp"
path-detail="documentation/cmessturbointruder.webp"
alt="THM CMesS" %}

Now simply change the wordlist in the python code, i used `/usr/share/SecLists/Discovery/DNS/subdomains-top1million-20000.txt`, click on `Attack` to start bruteforcing for subdomains.
And it found `dev`, i.e `dev.cmess.thm`. Navigating to that subdomain and we get this.

{% include image.html path="documentation/cmessdev.webp"
path-detail="documentation/cmessdev.webp"
alt="THM CMesS" %}

So we got credentials for `andre@cmess.thm`. And yep we successfully loggined into the cms admin pannel using these creds.

### Exploitation

On dashboard, in content, file system seems like we can upload files to webserver. I am going to use the one by pentest monkey, you can get it from [here](https://github.com/pentestmonkey/php-reverse-shell). And it got uploaded successfully to the server at location `http://cmess.thm/assets/shell.php`. _note shell.php is the name of file[revshell] I uploaded._
Starting the netcat listener

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Downloads]
└──╼ $rlwrap nc -lvnp 9889
listening on [any] 9889 ...
{% endhighlight %} 

Navigating to `http://cmess.thm/assets/shell.php` and watt no revshell, looked at the file[reverse shell] on cms it was empty, on a little enum, i figured our user doesn’t have perms to upload file yet but we can easily give admins all perms and get admin role n Administration/user section, repeating the process and yep we finally got our revshell.

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Downloads]
└──╼ $rlwrap nc -lvnp 9889
listening on [any] 9889 ...
connect to [10.9.1.186] from (UNKNOWN) [10.10.210.131] 43410
Linux cmess 4.4.0-142-generic #168-Ubuntu SMP Wed Jan 16 21:00:45 UTC 2019 x86_64 x86_64 x86_64 GNU/Linux
 13:49:47 up 46 min,  0 users,  load average: 0.00, 0.00, 0.00
USER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT
uid=33(www-data) gid=33(www-data) groups=33(www-data)
/bin/sh: 0: cant access tty; job control turned off
$ whoami
www-data
$ 
{% endhighlight %} 

### Getting User

On enumerating the box, we find a file called `password.bak` in `/opt` which had user andre credentials.
{% include image.html path="documentation/cmessuser.webp"
path-detail="documentation/cmessuser.webp"
alt="THM CMesS" %}

Using ssh to get a shell as andre.

{% include image.html path="documentation/cmessuserssh.webp"
path-detail="documentation/cmessuserssh.webp"
alt="THM CMesS" %}

### Rooting the Box

On running linpeas on server we find this cronjob.

{% include image.html path="documentation/cmessprivesc.webp"
path-detail="documentation/cmessprivesc.webp"
alt="THM CMesS" %}

We can find a note about how to privesc using tar on [GTfobins](https://gtfobins.github.io/gtfobins/tar/). but here we don’t have sudo access to tar instead a root cronjob is running tar command. I had a hard time figuring it out that we need to do `wildcard injection`. This is a good [article](https://medium.com/@int0x33/day-67-tar-cron-2-root-abusing-wildcards-for-tar-argument-injection-in-root-cronjob-nix-c65c59a77f5e) that helped me to privesc. _This is the third link if you google `tar privesc`, google is your best friend._

{% include image.html path="documentation/cmessroot.webp"
path-detail="documentation/cmessroot.webp"
alt="THM CMesS" %}

###### I personally loved the privesc, if you guys have any doubts feel free to reach out to me on social media.