/* ==========================================
 * Asynchronous SiteCatalyst v1.0
 * http://github.com/DieProduktMacher/asyncSC
 * ==========================================
 * Copyright:
 *   2013 DieProduktMacher GmbH
 *		
 * Authors:
 *	 Tobias Kleyer <tobias.kleyer@produktmacher.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

_asc = (function(asc){
	var to_return = {};  // object to return from anonymous function
	var queue = asc;  // the queue where all "tasks" are stored until given to the trackers
	var loadedTrackers = {};  // Trackers used by this script. Currently there is only one.
	
	///////////////////
	//  H E L P E R  //
	///////////////////
	to_return.utils = {
		/**
		 * helper function to remove duplicate entries from arrays
		 *
		 * @param arr an array with possible duplicate entries
		 * @return an array with all duplicates removed
		 */
		filter: function(arr){
			var o = {};
			var a = [];
			for(var i = arr.length;i--;){
				if(o.hasOwnProperty(arr[i])) {
					continue;
				}
				a.push(arr[i]);
				o[arr[i]] = 1;
			}
			return a;
		},
		/**
		 * Loads a script asynchronously and executes callback when finished
		 *
		 * @param url the full (or relative) path to the script to load
		 * @param callback the function to execute after the script is loaded
		 */
		getScript: function(url, callback) {
			var h = document.getElementsByTagName('script')[0];
		  var el = document.createElement('script');
			el.type = 'text/javascript';
			el.async = true;
		  el.src = url;

		  // Handle Script loading
		  var done = false;

		  // Attach handlers for all browsers
		  el.onload = el.onreadystatechange = function(){
		  	if ( !done && (!this.readyState || this.readyState == 'loaded' || this.readyState == 'complete') ) {
		    	done = true;
		      if (callback){
						callback();
					}
		      // Handle memory leak in IE
		      el.onload = el.onreadystatechange = null;
				}
		  };

			h.parentNode.insertBefore(el, h);
		  return undefined;
		},
		/**
		 * Combines two 1-dimensional json objects into one.
		 * 
		 * @param target the object where the new properties should be mixed in
		 * @param source the object to include in the target object
		 * @param force determines if source properties should overwrite target properties (default: true)
		 * @return the combined object (note: the target is overwritten too)
		 */
		mixin: function(target, source, force){
			force = force === false?false:true;
			for(var src in source){
				if(source.hasOwnProperty(src)){
					if(force || !target.hasOwnProperty(src)){
						target[src] = source[src];
					}
				}
			}
			return target;
		},
		/**
		 * Splits a url string in a window.loctation-like object
		 *
		 * @param url a complete url
		 */
		getLocation: function(url){
			var ret = {};
			var a = document.createElement('a');
			a.href = url;	
			var fields = ['href','protocol','host','hostname','port','pathname','search','hash'];
			for(var i = fields.length; i--; ){
				ret[fields[i]] = a[fields[i]];
			}
			return ret;
		}
	};

	/////////////////////////////
	// R E Q U I R E M E N T S //
	/////////////////////////////	
	/**
	 * Recursively handles all requirements given
	 *
	 * @param requirements an array of requirements
	 * @param callback function to call after all requirements are met
	 */
	var require = function(requirements, callback){
		var that = this;
		var args = arguments, shifted_req;
		shifted_req = this.tracker.requirements[requirements.shift()];
		if (requirements.length > 0) {  // if more than on requirement left recursively call require
			if (shifted_req[0]) {
				args.callee.call(that, requirements, callback);
			} else {
				shifted_req[0] = true;
				shifted_req[1]((function(){args.callee.call(that, requirements, callback);}));
			}	
		} else if (shifted_req[0]) {
			callback();
		} else {
			shifted_req[0] = true;
			shifted_req[1](callback);
		}
	};

	////////////////////////////
	// T R A C K I N G  A P I //
	////////////////////////////
	var Tracker = function(tracker){
		this.tracker = tracker;  // the tracker object
		this.queue = [];  // individual queue for each tracker
		var that = this;
		
		/**
		 * Handle single Queue Element. Pulls the first element from the queue and 
		 * performs the task.
		 * Recursively calls itself until no tasks are left in the queue.
		 *
		 * @param (optional) queue an array of tasks
		 */
		var performTask = function(queue){
			queue = queue || that.queue;
			var currentTask, currentTracker, currentRequirements;
			if (currentTask = queue.shift()) {  // "=" is correct
				if (typeof that.tracker[currentTask[0]] != 'undefined'){
					currentTracker = that.tracker[currentTask[0]];
					if (currentTracker.length > 1) {  // There are some requirements
						currentRequirements = currentTracker.slice(1);
						require.call(that, currentRequirements, 
							function(){
								currentTracker[0].apply(that, currentTask.slice(1));
								performTask(queue);
							}
						);
					} else {
						currentTracker[0].apply(that, currentTask.slice(1));
						performTask(queue);
					}
				}
			}	
		};
		/**
		 * Add a task to the tracker queue
		 */
		this.push = function(){
			for(var i = 0, l = arguments.length; i < l; i++){
				that.queue.push(arguments[i]);
			}
			performTask(that.queue);
		};
	};
	
	/**
	 * Attaches a Tracker to listen on all tasks
	 *
	 * @param name the name of the tracker
	 * @param tracker the tracker closure
	 */
	to_return.addTracker = function(name, tracker){
		loadedTrackers[name] = new Tracker(tracker);
		loadedTrackers[name].push.apply(loadedTrackers[name], queue);
		queue = [];
	};
	/*
	 * Function to send any tasks to the queue. The tasks are routed to the trackers afterwards
	 */
	to_return.push = function(){
		for(var i = 0, l = arguments.length; i < l; i++){
			queue.push(arguments[i]);
		}
		for(var t in loadedTrackers){
			loadedTrackers[t].push.apply(loadedTrackers[t], queue);
		}
		queue = [];
	};
	return to_return;
})(_asc || []);
		
/*
 * The SiteCatalyst Tracker
 */
_asc.addTracker('SiteCatalyst', (function(){
	var sLocal = {};  // Store all SC Variables
	var that = this;  // For later reference 
	
	//////////////////////
	// S C  H E L P E R //
	//////////////////////
	/**
	 * This function is a wrapper around the complicated logic to use the native s.tl function 
	 * of SiteCatalyst.
	 * It takes care of the configuration of linkTrackVars and linkTrackEvents
	 * @param obj A link obj to induce the 500ms delay or true to not use a delay
	 * @param lt The type of custom link tracking (o: custom, e: exits, d: downloads)
	 * @param ln The name of the link
	 * @param vars An object of SiteCatalyst variables to set
	 */
	var track = function(obj, lt, ln, vars){
		var s = s_gi(window['s_account']);
		var tempLinkVars = s.linkTrackVars;
		var tempEvents = s.linkTrackEvents;
		var params = s.linkTrackVars.toLowerCase() == "none" ? []: s.linkTrackVars.split(',');
		var events = s.linkTrackEvents.toLowerCase() == "none" ? []: s.linkTrackEvents.split(',');	
		if(vars){
			if(vars.hasOwnProperty('events')){
				events.concat(vars['events'].split(','));
			}
			for(var key in vars){
				if(vars.hasOwnProperty(key)){
					key = key.replace(/^evar/,'eVar');  // Correct variable name if necessary
					s[key] = vars[key];
					params.push(key);
				}				
			}
			s.linkTrackVars = _asc.utils.filter(params).join(',');
			s.linkTrackEvents = _asc.utils.filter(events).join(',');
		}	
		s.tl(obj, lt, ln);
		s.linkTrackVars = tempLinkVars;
		s.linkTrackEvents = tempEvents;
	};
	/**
	 * Clears the local and global SC variable object.
	 */
	var clearSObject = function(){
		sLocal = {};  // clear local object
		
		var svar = window[to_return.config['sVariable']];
		for(var i = 75; i--; ){
			delete svar['prop'+i];
			delete svar['eVar'+i];
			delete svar['hier'+i];
			delete svar['list'+i];
		}
		var properties = ['channel', 'pageName', 'campaign', 'server', 'referrer', 'zip', 'state', 'purchaseID', 'transactionID', 'events', 'pageType', 'products'];
		for(i = properties.length; i--; ){
			delete svar[properties[i]];
		}
	};
	/**
	 * Returns the full path of the asyncSC.js
	 */
	var getDefaultScriptPath = function(){
		var path = _asc.utils.getLocation(document.getElementById('_ascid').src);
		return path.pathname.replace(/\/[^\/]*\.js$/i, '/s_code.js');
	};
	
	var to_return = {
		////////////////////////////////
		// D E F A U L T  C O N F I G //
		////////////////////////////////
		config: {
			disableTracking: false,  // Disable all tracking
			scodePath: getDefaultScriptPath(),  // Path to the s_code.js script on your server
			sVariable: 's',  // Name of the SiteCatalyst Variable. The default is s.
			account: ''
		},
		
		requirements: {
			s_code: [false, function(callback){
				_asc.utils.getScript(to_return.config.scodePath, callback);		
			}],
			setAccount: [false, function(callback){
				var svar = window[to_return.config['sVariable']];
				svar.sa(to_return.config.account || window['s_account']);
				callback();
			}]
		},
		
		//////////////////////////
		// T R A C K E R  A P I //
		//////////////////////////
		setSCVariableName: [function(sVariable){
			to_return.config['sVariable'] = sVariable;
		}],
		setCustomVars: [function(sVars){
			sLocal = _asc.utils.mixin(sLocal, sVars);
		}],
		setConfig: [function(newConfig){
			to_return.config = _asc.utils.mixin(to_return.config, newConfig);
		}],
		trackPageview: [function(){
			if(to_return.config.disableTracking){return;}
			var svar = window[to_return.config['sVariable']];
			svar = _asc.utils.mixin(svar, sLocal);
			svar.t(sLocal);
			clearSObject();
		}, 's_code', 'setAccount'],
		setAccount: [function(rsid){
			var svar = window[to_return.config['sVariable']] || {};
			if(to_return.requirements.s_code[0] && typeof svar.sa == 'function'){
				svar.sa(rsid);
			}
			window['s_account'] = rsid;
			to_return.config.account = rsid;
		}],
		disableTracking: [function(){
			to_return.setConfig[0]({disableTracking: true});
		}],
		setScodePath: [function(path){
			to_return.setConfig[0]({scodePath: path});
		}],
		trackClick: [function(linkName){
			if(to_return.config.disableTracking){return;}
			var arr = [true, 'o', linkName, sLocal];
			track.apply(that, arr);
			clearSObject();
		}, 's_code', 'setAccount'],
		trackLink: [function(linkName, linkObj){
			if(to_return.config.disableTracking){return;}
			var a = linkObj || document.createElement('a');
			a.href = a.href || linkName;
			var arr = [a, 'o', linkName, sLocal];
			track.apply(that, arr);
			clearSObject();
		}, 's_code', 'setAccount']
	};
	
	return to_return;
})());