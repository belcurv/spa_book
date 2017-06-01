/* spa.shell.js
   Shell module for SPA
*/

/* jshint esversion:6 */
/* globals jQuery, window, spa */

spa.shell = (function ($) {
    
    'use strict';
    
    /* ==================== INIT MODULE SCOPE VARIABLES ==================== */
    
    var 
    
        // static configuration values
        configMap = {
            
            // map used by uriAnchor for validation
            anchor_schema_map: {
                chat: { opened : true, closed: true }
            },
            
            // html template
            main_html: `
                <div class="spa-shell-head">
                    <div class="spa-shell-head-logo"></div>
                    <div class="spa-shell-head-acct"></div>
                    <div class="spa-shell-head-search"></div>
                </div>

                <div class="spa-shell-main">
                    <div class="spa-shell-main-nav"></div>
                    <div class="spa-shell-main-content"></div>
                </div>

                <div class="spa-shell-foot"></div>
                <div class="spa-shell-modal"></div>`,
            
            // interval in ms between resize event consideration
            resize_interval: 200
        },
        
        // dynamic information shared across the module
        stateMap = {
            anchor_map  : {},        // store for current anchor values
            resize_idto : undefined  // store resize timeout ID
        },
        
        // jQuery collections cache container
        jqueryMap = {};
        
    
    /* ========================== UTILITY METHODS ========================== */
    
    // return copy of stored anchor map to minimize overhead
    function copyAnchorMap() {
        return $.extend( true, {}, stateMap.anchor_map );
    }
    
        
    /* ============================ DOM METHODS ============================ */
    
    /* cache jQuery collections to reduce document traversals & improve perf
    */
    function setJqueryMap() {
        var $container = stateMap.$container;
        jqueryMap = {
            $container : $container
        };
    }
    
    
    /* Changes part of the URI anchor component
     * @params    [object]   arg_map    [map describing what part of URI anchor to change]
     * @returns   [boolean]             [true if target URI Anchor part was updated]
    */
    function changeAnchorPart(arg_map) {

        var anchor_map_revise = copyAnchorMap(),
            bool_return       = true,
            key_name,
            key_name_dep;
        
        // merge changes into anchor map
        KEYVAL:
        for ( key_name in arg_map ) {
            if (arg_map.hasOwnProperty( key_name )) {
                
                // skip dependent keys during iteration
                if (key_name.indexOf('_') === 0 ) { continue KEYVAL; }
                
                // update independent key values
                anchor_map_revise[key_name] = arg_map[key_name];
                
                // update matching dependent key
                key_name_dep = '_' + key_name;
                if ( arg_map[key_name_dep] ) {
                    anchor_map_revise[key_name_dep] = arg_map[key_name_dep];
                } else {
                    delete anchor_map_revise[key_name_dep];
                    delete anchor_map_revise['_s' + key_name_dep];
                }
            }
        }
        
        // attempt to update URI, revert on fail
        try {
            $.uriAnchor.setAnchor( anchor_map_revise );
        } catch (error) {
            // replace URI with existing state
            $.uriAnchor.setAnchor( stateMap.anchor_map, null, true );
            bool_return = false;
        }
        
        return bool_return;
        
    }
    
    
    /* ========================== EVENT HANDLERS =========================== */
    
    /* onHashChange
     
       Purpose    : Handles the hashchange event
       Arguments  :
         * event - the jQuery event object
       Actions    :
         * Parses the URI anchor component
         * Compares the propsed application state with current
         * Adjust the application only where proposed state differs from
           existing and is allowed by anchor_schema_map
       Returns    : false
    */
    function onHashChange(event) {
        
        var anchor_map_previous = copyAnchorMap(),
            anchor_map_proposed,
            _s_chat_previous,
            _s_chat_proposed,
            s_chat_proposed,
            is_ok = true;
        
        // attempt to parse anchor; if invalid return to previous anchor
        try {
            anchor_map_proposed = $.uriAnchor.makeAnchorMap();
        } catch (error) {
            $.uriAnchor.setAnchor( anchor_map_previous, null, true );
            return false;
        }
        stateMap.anchor_map = anchor_map_proposed;
        
        // assign convenience vars
        _s_chat_previous = anchor_map_previous._s_chat;
        _s_chat_proposed = anchor_map_proposed._s_chat;
        
        // adjust chat component if changed
        if (!anchor_map_previous || _s_chat_previous !== _s_chat_proposed) {
            s_chat_proposed = anchor_map_proposed.chat;
            switch (s_chat_proposed) {
                case 'opened':
                    is_ok = spa.chat.setSliderPosition('opened');
                    break;
                case 'closed':
                    is_ok = spa.chat.setSliderPosition('closed');
                    break;
                default:
                    spa.chat.setSliderPosition('closed');
                    delete anchor_map_proposed.chat;
                    $.uriAnchor.setAnchor( anchor_map_proposed, null, true );
            }
        }
        
        // if slider change denied, revert anchor value to previous or default
        if (!is_ok) {
            if (anchor_map_previous) {
                $.uriAnchor.setAnchor(anchor_map_previous, null, true);
                stateMap.anchor_map = anchor_map_previous;
            } else {
                delete anchor_map_proposed.chat;
                $.uriAnchor.setAnchor(anchor_map_proposed, null, true);
            }
        }
        
        return false;
        
    }
    
    
    /* onResize
    */
    function onResize() {
        
        // bail if resize timer is already currently running
        if (stateMap.resize_idto) { return true; }
        
        spa.chat.handleResize();
        
        // timeout function clears its own timeout ID
        stateMap.resize_idto = setTimeout(
            function() {
                stateMap.resize_idto = undefined;
            },
            configMap.resize_interval
        )
        
        // return true from window.resize event so jQuery doesn't
        // prefentDefault() or stopPropagation()
        return true;
    }
    
    
    /* ============================= CALLBACKS ============================= */
    
    /* setChatAnchor - provided to Chat as a safe way to request a URI change
    
       Example   : setChatAnchor('closed');
       Purpose   : Change the chat component of the anchor
       Arguments :
         * position_type = may be 'closed' or 'opened'
       Action    : Changed the URI anchor parameter 'chat' to the requested
                   value if possible
       Returns   :
         * true  - requested anchor part was updated
         * false - requested anchor part was not updated
       Throws    : none
    */
    function setChatAnchor(position_type) {
        return changeAnchorPart({ chat: position_type });
    }
    
    
    /* ========================== PUBLIC METHODS =========================== */
    
    /* initModule
    
       Example   : spa.shell.initModule( $('#app_div_id') );
       Purpose   : Directs the Shell to offer its capability to the user
       Arguments :
         * $container - jQuery collection representing a single DOM container
                        Ex. $('#app_div_id')
       Action    : Populates $container with the shell of the UI, then configures
                   and initializes feature modules. Shell is also responsible for
                   browser-wide issues such as URI anchor and cookie management.
       Returns   : none
       Throws    : none
    */
    function initModule($container) {
        
        // load html and map jQuery collections
        stateMap.$container = $container;
        $container.html( configMap.main_html );
        setJqueryMap();
        
        // configure uriAnchor to use our schema
        $.uriAnchor.configModule({
            schema_map: configMap.anchor_schema_map
        });
                
        // configure and init feature modules
        spa.chat.configModule({
            set_chat_anchor : setChatAnchor,
            chat_model      : spa.model.chat,
            people_model    : spa.model.people
        });
        spa.chat.initModule( jqueryMap.$container );
        
        /* bind & trigger 'hashchange' event AFTER all feature modules are
           configured and initialized. Otherwise they will not be ready to
           handle the trigger event, which is used to ensure the anchor is
           considered on-load
        */
        $(window)
            .bind('resize', onResize)
            .bind('hashchange', onHashChange)
            .trigger('hashchange');
                
    }
    
    
    /* ====================== EXPORT PUBLIC METHODS ======================== */
    
    return {
        initModule: initModule
    };
    
}(jQuery));
