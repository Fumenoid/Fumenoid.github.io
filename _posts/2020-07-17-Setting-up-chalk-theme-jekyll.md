---
layout: post
title: "Setting up chalk theme, Jekyll"
description: "This writup covers how can someone setup the chalk theme in Jekyll and how to set it up on gitpages."
thumb_image: "documentation/jekyllthumb.jpg"
tags: [ programming ]
---

{% include image.html path="documentation/jekyll.jpg"
path-detail="documentation/jekyll.jpg"
alt="Jekyll" %}

### What is Jekyll ?
Jekyll is a simple, blog-aware, static site generator for personal, project, or organization sites.
It is very helpful to quickly setup a blog post also you can host that it on gitpages if you like.

### Prerequesties
I hope you have enviroment for jekyll already setup before following this post, if you haven't done that it yet, follow this link to [jekyll docs](https://jekyllrb.com/docs/).

### Getting Chalk Theme

##### Clone the chalk theme - [Chalk theme github](https://github.com/nielsenramon/chalk)
{% highlight bash %}
┌─[fumenoid@parrot]─[~]
└──╼ $git clone https://github.com/nielsenramon/chalk.git
Cloning into 'chalk'...
remote: Enumerating objects: 1494, done.
remote: Total 1494 (delta 0), reused 0 (delta 0), pack-reused 1494
Receiving objects: 100% (1494/1494), 14.09 MiB | 73.00 KiB/s, done.
Resolving deltas: 100% (780/780), done.
{% endhighlight %}
#### Install the requirements
In chalk theme directory
{% highlight bash %}
┌─[fumenoid@parrot]─[~]
└──╼ $npm run setup
{% endhighlight %}
#### Run the jekyll theme in your system 
{% highlight bash %}
┌─[fumenoid@parrot]─[~]
└──╼ $npm run local
{% endhighlight %}

You may see a lot of warnings, but ignore them now if you navigate to [http://127.0.0.1:4000](http://127.0.0.1:4000) you will see the chalk theme running.

### Configuring the theme

Many settings can be easily configured in `_config.yml`, but somehow any changes i did in `_assets/stylesheets/_variable.scss` broke the theme so i ended up changing css in `light*.css` and `dark*.css` files in `_site` for both themes.

Another important feature that is there in the theme is adding thumbnail's of post but somehow code for this is missing from `index.html`, in the end my friend syzmex helped me with it.
so to add thumbnail's in post replace the code in `index.html` with this [code](https://gist.github.com/Fumenoid/598a79b96390f1169e06db76157cd1ab) and now you can give thumbnail image address when you create a post.

### Setting up gitpages

Alright so as the original repo stated, the theme doesn't work on gitpages but you can easily do it by uploading the content of `_site` to your git page repository.

###### If you face any issues / have any query, feel free to contact me on social media.
