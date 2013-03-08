# asyncSC - Asynchronous SiteCatalyst

asyncSC is an extension to the Adobe SiteCatalyst tracking library s_code.js. It brings two features to SiteCatalyst that the default implementation is sorely lacking.

1. Asynchronous loading
asyncSC will manage the loading and execution of the script asynchronously and lazily. That means the s_code.js tracking library will no longer block your page load, and additionally it will only be loaded when really needed.

2. Ease of use
asyncSC will make the integration of SiteCatalyst a lot easier. The script uses a consistent and easy understandable syntax, that completely hides the complicated internals of the standard SiteCatalyst tracking.


You can use asyncSC with your existing s_code.js as provided by SiteCatalyst. No changes have to be made to the script.
If you have special extensions (like plugins) or settings (like Download Tracking) configured in the s_code.js they will resume working.


## Basic Integration

The basic implementation consists of few steps:

1. Download asyncSC.js
2. Place asyncSC.js alongside your s_code.js on you server
3. Include the minimal code snippet on all pages you want to be tracked
4. Change the path to the asyncSC according to your placement of the code in step 2

```html
<!-- Standard configuration of asyncSC. A page view will be tracked. -->
<script type="text/javascript">
  var _asc = _asc || [];
  _asc.push(['trackPageview']);

  (function(p,h,sc) {
    sc=document.createElement('script');sc.type='text/javascript';sc.src=p;sc.async=1;sc.id='_ascid';
    h=document.getElementsByTagName('script')[0];h.parentNode.insertBefore(sc, h);
  })('/path-to-script/asyncSC.js');  // configure path to script here
</script>
```

**Note**: This setup assumes that you use the default name "s_code.js" for the SiteCatalyst Library and that it is placed in the same folder as asyncSC.js on your server. (This settings can be changed if necessary. See below.)


## Configuring the integration


### Changing the path to s_code.js

If your s_code.js is not hosted in the same folder as the asyncSC script, or if the script is stored under a different name you can change the setting.

```javascript
// change the path to the s_code.js to "/path-to-script/s_code.js"
_asc.push(['setScodePath', '/path-to-script/s_code.js']);
```

### Changing the SiteCatalyst variable

By default, SiteCatalyst uses the global variable "s". If you use a different global variable the setting can be changed like this.

```javascript
// change the global SiteCatalyst variable to "snew"
_asc.push(['setSCVariableName', 'snew']);
```

### Changing the report suite

The default report suite in the script can be changed with the following command.

```javascript
// set account to "new_rsid"
_asc.push(['setAccount', 'new_rsid']);
```

## Setting Custom variables and tracking a page view

It is possible to set any SiteCatalyst custom variable. 

```javascript
// sets the SiteCatalyst pageName, events and prop1 variable
_asc.push(['setCustomVar', {pageName: 'Pagename', events: 'event1', prop1: 'value'}]);
```

By default existing variables are overwritten. This can be changed by passing false to the tracker.

```javascript
_asc.push(['setCustomVar', {pageName: 'Pagename'}, false]);  // will not overwrite pageName if it already exists
```

## Tracking a page view

When triggering a page view, any variables set beforehand will be sent to SiteCatalyst. 

While it is possible to send a page view without a pageName, SiteCatalyst strongly encourages to set one on every page.

```javascript
// track a page view
_asc.push(['trackPageview']);


// Recommended: always set a pageName for each page view
_asc.push(['setCustomVar', {pageName: 'Pagename'}]);
_asc.push(['trackPageview']);
```

## Link & Click Tracking

Click Tracking can be used to track user interactions that happen outside of the page view. Typical examples are clicks on a link or changing form elements.

asyncSC provides two different functions. Link Tracking can be used in cases where a click results in a new page beeing loaded (in the same window). Click Tracking should be used whenever the measured click doesn't result in a new page load.



### Link Tracking
This function inserts a short delay (< 500ms), to ensure, that the tracking request will be sent to SiteCatalyst before the browser loads the new page. 

Link Tracking always requires a link name to be set.

```javascript
// track a link click with the name "link name"
_asc.push(['trackLink', 'link name']);
```
Of course it is possible to pass any custom variables to the request.

```javascript
// set SiteCatalyst variables
_asc.push(['setCustomVar', {events: 'event2', eVar1: 'value'}]);
// track a link click with the name "link name" and all previously set custom variables
_asc.push(['trackLink', 'link name']);
```

Full example

```html
<!-- Example of a link tracking call. -->
<a href="", onclick="_asc.push(['setCustomVars', {eVar1: 'value', events: 'event2'}], ['trackLink', 'Linkname']);">Link with Tracking</a>
```


### Click Tracking
This function works without a delay. It is recommended to use this function wherever possible.

Click Tracking always requires a click name to be set.

```javascript
// track a link click with the name "click name"
_asc.push(['trackLink', 'click name']);
```

Analog to the link tracking, any custom variables can be passed to the request.

```javascript
// set SiteCatalyst variables
_asc.push(['setCustomVar', {events: 'event2', eVar1: 'value'}]);
// track a click with the name "click name" and all previously set custom variables
_asc.push(['trackClick', 'click name']);
```

## Additional features

### Disable Tracking

It is possible to completely disably the tracking on individual pages. 

```javascript
// disable tracking for all following requests
_asc.push(['disableTracking']);
```

## Copyright and License





