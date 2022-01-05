---
layout: post
title: "Port Forwarding"
description: "Basics and practical applications of the sorcery called Port Forwarding."
thumb_image: "documentation/portforwardingthumb.png"
tags: [ sorcery ]
---

{% include image.html path="documentation/portforwardingmain.webp"
path-detail="documentation/portforwardingmain.webp"
alt="Port Forwarding" %}

## Port Forwarding [Theory]

Port Forwarding/tunneling ? what is this sorcery ?
Alright, so it’s really not that hard to understand. To sum it up, we are just forwarding a service running on a specific port on the server to a specific port on our local machine. You feel cheated right, lol ofc I wouldn’t have been writing a complete blog post if it was this simple.

Let’s jump into it and do some practical stuff.

## Practical

Assume you are doing post exploitation enumeration on a server and you discover a web service is running on the server but it is binded to address `127.0.0.1:8080` instead of `0.0.0.0:8080` . . …but wait, what is the meaning of binded to address or bind address ??

A bind address defines on which network a service is accessible, for eg imagine if i have a `public ip` - `57.234.890.210` (ik this IP is not possible) and `internal network ip` - `10.10.10.120` and `127.0.0.1` - `local address`. So, if I play around with config files and bind the service to IP `57.234.890.210` it will be accessible to everyone on internet, similarly if i bind it to `10.10.10.120` then it will only be accessible to anyone on the internal network, and if we bind it to `127.0.0.1` it will be accessible only on our local machine. Finally, if we bind the service to `0.0.0.0` it will be accessible to everyone/anyone i.e internet, local network and our local machine.

### POC [bind address]

I am using a kali vm in live mode, also it’s bridged to my main host to make a enviroment similar to an internal network and the service that I am demonstrating is an apache web server.

#### Configuring the vm.
1. Checking IP address of internal/local network in the kali virtual machine.
{% include image.html path="documentation/portforwardingipaddress.webp"
path-detail="documentation/portforwardingipaddress.webp"
alt="Port Forwarding" %}

2. Editing /etc/apache2/ports.conf and binding ip:port address to the internal/local network IP address.  
{% include image.html path="documentation/portforwardingapache.webp"
path-detail="documentation/portforwardingapache.webp"
alt="Port Forwarding" %}

#### Accessing the apache service.
1. In VM 
{% include image.html path="documentation/portforwordingunaccessableservice.webp"
path-detail="documentation/portforwordingunaccessableservice.webp"
alt="Port Forwarding" %}

2. On our local host which is on same network 
{% include image.html path="documentation/portforwardingbindedworking.webp"
path-detail="documentation/portforwardingbindedworking.webp"
alt="Port Forwarding" %}

#### Conclusion of POC [bind address]
As explained above the service is binded to the IP address of internal network so any system in the internal network can access the service.

- On this note, as the kali box is connected to the internal network, it can also access the apache service it is hosting but we will have to use internal network address instead the local address. 
{% include image.html path="documentation/portforwardingkaliinternalwork.webp"
path-detail="documentation/portforwardingkaliinternalwork.webp"
alt="Port Forwarding" %}

Alright, so now we know what is `bind address` and the conditions in which we use port forwarding. So, I am trying to replicate a condition in our lab enviroment to demonstrate port forwarding. I am not documenting the steps but it is similar to what we just did but instead of binding the service to internal network IP address I am binding it to `localhost` or `127.0.0.1` on port `8080`, so that no one except the person on box can access that service(apache web server).

- Lab setup after completition. 
{% include image.html path="documentation/portforwardinghiddenservice.webp"
path-detail="documentation/portforwardinghiddenservice.webp"
alt="Port Forwarding" %}

Let’s start the discussion on the main topic, i.e

## Port Forwarding

So, we are assuming we have `ssh` access of the kali box, let’s start our post enumeration process.

{% highlight bash %}
fumenoid@kali:~$ id
uid=1000(fumenoid) gid=1000(fumenoid) groups=1000(fumenoid)
fumenoid@kali:~$ ls
important.txt
fumenoid@kali:~$ cat important.txt 
I am making a secret hacker portal but for now i will have to keep it hidden from the network.

secret creds are..
admin:password
{% endhighlight %} 

lol.. Yes, I created a silly story to make it look like an actual post enumeration, anyway, let’s see the web services running on the box and their bind addresses.

{% highlight bash %}
fumenoid@kali:~$ netstat -tulpn
(Not all processes could be identified, non-owned process info
 will not be shown, you would have to be root to see it all.)
Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name    
tcp        0      0 127.0.0.53:53           0.0.0.0:*               LISTEN      -                   
tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN      -                   
tcp        0      0 127.0.0.1:631           0.0.0.0:*               LISTEN      -                   
tcp        0      0 127.0.0.1:8080          0.0.0.0:*               LISTEN      -                   
tcp6       0      0 :::22                   :::*                    LISTEN      -                   
tcp6       0      0 ::1:631                 :::*                    LISTEN      -                   
udp        0      0 127.0.0.53:53           0.0.0.0:*                           -                   
udp        0      0 0.0.0.0:68              0.0.0.0:*                           -                   
udp        0      0 0.0.0.0:5353            0.0.0.0:*                           -                   
udp        0      0 0.0.0.0:40410           0.0.0.0:*                           -                   
udp        0      0 0.0.0.0:631             0.0.0.0:*                           -                   
udp6       0      0 :::46153                :::*                                -                   
udp6       0      0 :::5353                 :::*                                -                   
fumenoid@kali:~$ 
{% endhighlight %} 

So, we found various services running on localhost but we are interested in `apache2` rn which is running on port `8080`. We have a shell on the box so we can’t technically open the browser and look at that secret admin panel and this is where the role of port forwarding comes to the play :D

### SSH Tunneling

Alright, here is the first sorcery, `ssh local port forwarding`.<br>
As the name itself implies, we forward a local port from the client machine to the server. Basically, the ssh client forwards a port and when it receives a connection it creates tunnel through which the data of a service is passed from server[kali box] to client[parrot host].

{% include image.html path="documentation/portforwardingsshtunneling.webp"
path-detail="documentation/portforwardingsshtunneling.webp"
alt="Port Forwarding" %}

Let’s try it out.

{% highlight bash %}
┌─[fumenoid@parrot]─[~]
└──╼ $ssh -L 8080:127.0.0.1:8080 fumenoid@192.168.0.112
fumenoid@192.168.0.112s password: 
fumenoid@kali:~$ 
{% endhighlight %} 

Breakdown of the command, `-L` is used for local port forwarding `8080:127.0.0.1:8080` here first `8080` is the local port(we can use any port) we are forwarding to the server which gets connected with server’s port `8080`(the port on which service is running on), so that a tunnel can be created through which data is passed, `127.0.0.1:8080` is the running service who’s data is passed through the tunnel we just created.<br>
Now let’s navigate to `http://127.0.0.1:8080` and yep it works :D

{% include image.html path="documentation/portforwardingworking.webp"
path-detail="documentation/portforwardingworking.webp"
alt="Port Forwarding" %}

So, this was `ssh local port forwarding`, cool.. right ? But the issue with it is, if there is firewall on the server[our kali box] which doesn’t allow connection on port `8080` we won’t be able to do a `ssh local port forwarding` to access the apache service as we are fowarding a port to connect to the service on a port(in our case port 8080) on server which is blocked by firewall. And the other issue is when we don’t have ssh access on the box we can’t basically do a `ssh local port forwarding`. 

{% include image.html path="documentation/portforwardingfirewall.webp"
path-detail="documentation/portforwardingfirewall.webp"
alt="Port Forwarding" %}

And that’s where our next port forwarding sorcery comes to place... .

### Port forwarding via Chisel

[Chisel](https://github.com/jpillora/chisel) is a tool which can be used to create a `reverse tunnel`, i.e instead of us connecting to the server like in `ssh tunneling` the server connects back to our client.

{% include image.html path="documentation/portforwardingchisel.webp"
path-detail="documentation/portforwardingchisel.webp"
alt="Port Forwarding" %}

Installing it is simple. `git clone` the `chisel` repo and then use `go build` to create the executable or you can get it from [here](https://github.com/jpillora/chisel/releases). Once done, upload it to the server using python server or any other way.
On Attacker machine we create a server with chisel, remember to use `--reverse` flag for a reverse tunneling to evade firewall.

{% highlight bash %}
┌─[fumenoid@parrot]─[/opt/chisel]
└──╼ $./chisel server --port 8000 --reverse
2020/08/09 03:04:11 server: Reverse tunnelling enabled
2020/08/09 03:04:11 server: Fingerprint 81:b5:bf:e4:1f:bd:39:dc:cd:a0:b3:3e:38:95:59:51
2020/08/09 03:04:11 server: Listening on http://0.0.0.0:8000
{% endhighlight %} 

And on the server [kali box], do

{% highlight bash %}
fumenoid@kali:~$ ./chisel client 192.168.0.110:8000 R:8080:127.0.0.1:8080
2020/08/09 12:16:56 client: Connecting to ws://192.168.0.110:8000
2020/08/09 12:16:56 client: Fingerprint 05:39:9b:29:fd:3b:a6:00:bb:3c:d3:a1:a5:5f:cc:97
2020/08/09 12:16:56 client: Connected (Latency 815.445µs)
{% endhighlight %} 

you can see we got connected on our host system too.

{% highlight bash %}
┌─[fumenoid@parrot]─[/opt/chisel]
└──╼ $./chisel server --port 8000 --reverse
2020/08/09 17:43:26 server: Reverse tunnelling enabled
2020/08/09 17:43:26 server: Fingerprint 05:39:9b:29:fd:3b:a6:00:bb:3c:d3:a1:a5:5f:cc:97
2020/08/09 17:43:26 server: Listening on http://0.0.0.0:8000
2020/08/09 17:46:43 server: session#1: tun: proxy#R:8080=>8080: Listening
{% endhighlight %} 

And navigating to http://127.0.0.1:8080, we can see our secret login page again :D 

{% include image.html path="documentation/portforwardingworking.webp"
path-detail="documentation/portforwardingworking.webp"
alt="Port Forwarding" %}

Though it gave us the same result but now you know it’s actually `reverse tunneling` and really useful when we face a network with `firewalls`.

#### Additional Note

There are still many other tools that can be used for port forwarding, like `plink`.. also learn about `ssh remote port forwarding`, in it we forward a service running on our local port to other box using ssh.

#### Additional Resources

Here are some other cool resources that you can refer too.
1. [Difference between local and remote port forwarding](https://unix.stackexchange.com/questions/115897/whats-ssh-port-forwarding-and-whats-the-difference-between-ssh-local-and-remot)
2. [Chisel’s Official Readme](https://github.com/jpillora/chisel)
3. [Plink, an other portforwarding tool like chisel](https://www.ssh.com/ssh/putty/putty-manuals/0.68/Chapter7.html)
4. [Google, yes please google about it and learn more](https://www.google.com/)

###### Thanks for reading this blog, I hope it was helpful.. :D


