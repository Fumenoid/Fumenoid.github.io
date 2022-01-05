---
layout: post
title: "Secarmy-CTF box[unintended way]"
description: "Getting flags of the Secarmy-CTF box via unintended way"
thumb_image: "documentation/secarmy.gif"
tags: [ sorcery, forensics ]
---

{% include image.html path="documentation/secarmy.webp"
path-detail="documentation/secarmy.webp"
alt="Secarmy" %}

### DISCLAIMER

In this un-intended solution blog of `Secarmy` box, I changed my strategy and solved the box as a `forensic challenge` instead of a `pentest`. So yes, If Secarmy would have hosted the box on a server instead of giving us the `.ova` file, it can’t be solved using this method. Also according to the new rules by Secarmy, unintended ways were not allowed so this blog is just for learning how to analyse a `.ova` file[and get all the flags].

### Overview

TBH, Before doing the box un-intended way I wasn’t even sure if this method is possible or not, so I am gonna try to explain the factors that pushed me to try this method.

1. We had a `.ova` file
2. Every `.ova` file(basically a VM) need a separate storage, generally a `.vmdk` file, which is used to store the data.
3. If there is a storage device, can’t we `mount` on our `host machine`?

Now you guys are curious too, Right? Alrighty, let’s get to it.

### Analysing the .OVA File

I start by googling how can we analyse a `.ova` file. And luckily I reached this [forum](https://forums.virtualbox.org/viewtopic.php?f=1&t=80305) which explained what a `.ova` file is and how we can extract a `.vmdk` file from it.

So .ova file is just a `tar` that contains the OVF file, compressed VMDK files, and a manifest file.
Sweet now we know we can extract the `.vmdk` files from a `.ova` file. So let’s get back to Keyboard.

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Secarmy/Unintended]
└──╼ $tar -xvf SECARMY-VILLAGE-OSCP-GIVEAWAY.ova
SECARMY-VILLAGE-OSCP-GIVEAWAY.ovf
SECARMY-VILLAGE-OSCP-GIVEAWAY-disk001.vmdk
SECARMY-VILLAGE-OSCP-GIVEAWAY.mf
┌─[fumenoid@parrot]─[~/Desktop/Secarmy/Unintended]
└──╼ $ls
SECARMY-VILLAGE-OSCP-GIVEAWAY-disk001.vmdk  SECARMY-VILLAGE-OSCP-GIVEAWAY.ova
SECARMY-VILLAGE-OSCP-GIVEAWAY.mf            SECARMY-VILLAGE-OSCP-GIVEAWAY.ovf
{% endhighlight %} 

Awesome, we got our `.vmdk` file which store all the data of the `VM`.

### Analysing the .VMDK File

Time to jump back to google, OK GOOGLE `How to analyse a .vmdk file?`

And after a little researching, I reached this awesome [blog](https://www.altaro.com/vmware/extract-content-vmdk-files/) which had `4` ways that can be used to analyse a `.vmdk` file, I decided to use 2nd method that is, by using `7z`.

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Secarmy/Unintended/ExtractedVMDK]
└──╼ $7z e SECARMY-VILLAGE-OSCP-GIVEAWAY-disk001.vmdk

7-Zip [64] 16.02 : Copyright (c) 1999-2016 Igor Pavlov : 2016-05-21
p7zip Version 16.02 (locale=en_IN,Utf16=on,HugeFiles=on,64 bits,4 CPUs Intel(R) Core(TM) i3-5005U CPU @ 2.00GHz (306D4),ASM,AES-NI)

Scanning the drive for archives:
1 file, 1727493120 bytes (1648 MiB)

Extracting archive: SECARMY-VILLAGE-OSCP-GIVEAWAY-disk001.vmdk
--
Path = SECARMY-VILLAGE-OSCP-GIVEAWAY-disk001.vmdk
[REDACTED]
Everything is Ok

Files: 3
Size:       10735321088
Compressed: 1727493120
┌─[fumenoid@parrot]─[~/Desktop/Secarmy/Unintended/ExtractedVMDK]
└──╼ $ls
0.img  1.img  2.img  SECARMY-VILLAGE-OSCP-GIVEAWAY-disk001.vmdk
{% endhighlight %} 

Slick, let’s try to find more information about the files we extracted.

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Secarmy/Unintended/ExtractedVMDK]
└──╼ $file *
0.img:                                      data
1.img:                                      Linux rev 1.0 ext4 filesystem data, UUID=9639603b-3064-44c9-a1ee-8682c0042ce7 (extents) (64bit) (large files) (huge files)
2.img:                                      LVM2 PV (Linux Logical Volume Manager), UUID: qasxet-MOHd-nhAV-vGyy-jX11-P7T0-5jeXMt, size: 9660530688
SECARMY-VILLAGE-OSCP-GIVEAWAY-disk001.vmdk: VMware4 disk image
{% endhighlight %} 

Hmm.. time to jump back to `google`.

### Mounting the files on our system.

Hello `google`, my old friend.
Simply googling file types lead me to these blogs, [Mounting a linux rev…](https://superuser.com/questions/995207/how-to-mount-linux-rev-1-0-ext4-filesystem-data-file) and [Mounting a LVM partition](http://www.utilities-online.info/articles/Mount-an-LVM-partition-image-cloned-with-dd/)

First mounting the `1.img`
{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Secarmy/Unintended/ExtractedVMDK]
└──╼ $sudo losetup /dev/loop0 ./1.img 
[sudo] password for fumenoid: 
┌─[fumenoid@parrot]─[~/Desktop/Secarmy/Unintended/ExtractedVMDK]
└──╼ $sudo mount -o loop ./1.img /mnt/secarmy
┌─[fumenoid@parrot]─[~/Desktop/Secarmy/Unintended/ExtractedVMDK]
└──╼ $cd /mnt/secarmy
┌─[fumenoid@parrot]─[/mnt/secarmy]
└──╼ $ls
config-4.15.0-118-generic  initrd.img-4.15.0-118-generic  System.map-4.15.0-121-generic  vmlinuz-4.15.0-122-generic
config-4.15.0-121-generic  initrd.img-4.15.0-121-generic  System.map-4.15.0-122-generic
config-4.15.0-122-generic  lost+found                     vmlinuz-4.15.0-118-generic
grub                       System.map-4.15.0-118-generic  vmlinuz-4.15.0-121-generic
{% endhighlight %} 

POG !!!<br>
Yea, even irl I was shocked, but this looks like the `1.img` has the `boot` config, so let’s try mounting the `2.img`.

{% highlight bash %}
┌─[fumenoid@parrot]─[~/Desktop/Secarmy/Unintended/ExtractedVMDK]
└──╼ $sudo losetup /dev/loop1 ./2.img 
┌─[fumenoid@parrot]─[~/Desktop/Secarmy/Unintended/ExtractedVMDK]
└──╼ $sudo pvs
  PV         VG        Fmt  Attr PSize  PFree
  /dev/loop1 ubuntu-vg lvm2 a--  <9.00g    0 
┌─[fumenoid@parrot]─[~/Desktop/Secarmy/Unintended/ExtractedVMDK]
└──╼ $sudo vgchange -a y ubuntu-vg
  1 logical volume(s) in volume group "ubuntu-vg" now active
┌─[fumenoid@parrot]─[~/Desktop/Secarmy/Unintended/ExtractedVMDK]
└──╼ $sudo mount -o rw /dev/ubuntu-vg/ubuntu-lv /mnt/secarmydata/
┌─[fumenoid@parrot]─[~/Desktop/Secarmy/Unintended/ExtractedVMDK]
└──╼ $cd /mnt/secarmydata/
┌─[fumenoid@parrot]─[/mnt/secarmydata]
└──╼ $ls
bin   cdrom           dev  home        initrd.img.old  lib64       media  opt   root  sbin  srv       sys  usr  vmlinuz
boot  cincos-secrets  etc  initrd.img  lib             lost+found  mnt    proc  run   snap  swap.img  tmp  var  vmlinuz.old
{% endhighlight %}

Slick !!!

### Lets get those flag !

If you will notice i mounted the disk in a `read-write` mode by `mount -o rw` so now we can change perms and simply access all the data.

{% highlight bash %}
┌─[fumenoid@parrot]─[/mnt/secarmydata/home]
└──╼ $sudo chown fumenoid *
┌─[fumenoid@parrot]─[/mnt/secarmydata/home]
└──╼ $find . -type f -name flag*.txt -exec cat {} \; 2>/dev/null
Congratulations!
Here is your first flag segment: 'flag1{fb9e88}'
Congratulations! Here is your 6th flag segment: 'flag6{779a25}'
Congratulations!
Here is your 7th flag segment: 'flag7{d5c26a}'
Congratulations! Here is your third flag segment: 'flag3{ac66cf}'
Congratulations!
Here is your 9th flag segment: 'flag9{689d3e}'
Congratulations! Here is your 5th flag segment: 'flag5{b1e870}'
Congratulations!
Here is your 8th flag segment: 'flag8{5bcf53}'
Congratulations, here is your 4th flag segment: 'flag4{1d6b06}'
{% endhighlight %} 

UwU, let’s get that `root` flag now !

{% highlight bash %}
┌─[fumenoid@parrot]─[/mnt/secarmydata/root]
└──╼ $cat root.txt 
Congratulations!!!

You have finally completed the SECARMY OSCP Giveaway Machine

Here is your final flag segment: 'flag10{33c9661bfd}'

Head over to https://secarmyvillage.ml/ for submitting the flags!
{% endhighlight %} 

Yes we failed to get few flags, but as now we have access to data we can simply solve them, also I would `suggest` you to go the box `intended` way because it was fun !!

### CleanUp

{% highlight bash %}
┌─[fumenoid@parrot]─[~]
└──╼ $sudo umount /mnt/secarmy
┌─[fumenoid@parrot]─[~]
└──╼ $sudo umount /mnt/secarmydata 
┌─[fumenoid@parrot]─[~]
└──╼ $sudo losetup -d /dev/loop0
┌─[fumenoid@parrot]─[~]
└──╼ $sudo losetup -d /dev/loop1
{% endhighlight %} 

###### Hope you learned something new, also thank you secarmy for this fun box and letting me publish this unintended writeup blog.






