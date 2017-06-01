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
                chat: { open : true, closed: true }
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
                <div class="spa-shell-chat"></div>
                <div class="spa-shell-modal"></div>`,
            
            // speed & height config for slider chat motions
            chat_extend_time     : 1000,
            chat_retract_time    : 300,
            chat_extend_height   : 450,
            chat_retract_height  : 15,
            chat_extended_title  : 'Click to retract',
            chat_retracted_title : 'Click to extend'
        },
        
        // dynamic information shared across the module
        stateMap = {
            $container        : null,
            anchor_map        : {},    // store for current anchor values
            is_chat_retracted : true   // set by toggleChat method
        },
        
        // jQuery collections cache container
        jqueryMap = {};
        
    
    /* ========================== UTILITY METHODS ========================== */
    
    // return copy of stored anchor map to minimize overhead
    function copyAnchorMap() {
        return $.extend( true, {}, stateMap.anchor_map );
    }
    
        
    /* ============================ DOM METHODS ============================ */
    
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
    
    /* cache jQuery collections to reduce document traversals & improve perf
    */
    function setJqueryMap() {
        
        var $container = stateMap.$container;
        
        jqueryMap = {
            $container : $container,
            $chat      : $container.find('.spa-shell-chat') // cache slider DOM
        };
    }
    
    
    /* single method to extend or retract chat slider
     * @params    [boolean]    do_extend   [extends slider if 'true']
     * @params    [callback]   callback    [optional function to execute after end of animation]
     * @returns   [boolean]                [true if slider animation activated]
    */
    function toggleChat(do_extend, callback) {
        var px_chat_ht = jqueryMap.$chat.height(),
            is_open    = px_chat_ht === configMap.chat_extend_height,
            is_cloased = px_chat_ht === configMap.chat_retract_height,
            is_sliding = !is_open && !is_cloased;
        
        // avoid race condition
        if (is_sliding) { return false; }
        
        // extend chat slider if 'do_extend' is true
        if (do_extend) {
            jqueryMap.$chat.animate(
                { height: configMap.chat_extend_height },
                configMap.chat_extend_time,
                function() {
                    
                    // set slider 'tool tip'
                    jqueryMap.$chat.attr('title', configMap.chat_extended_title);
                    
                    // update slider state
                    stateMap.is_chat_retracted = false;
                    
                    // fire any passed callback
                    if (callback) { callback( jqueryMap.$chat ); }
                }
            );
            return true;
        }
        
        // otherwise retract chat slider
        jqueryMap.$chat.animate(
            { height: configMap.chat_retract_height },
            configMap.chat_retract_time,
            function() {
                
                // set slider 'tool tip'
                jqueryMap.$chat.attr('title', configMap.chat_retracted_title);

                // update slider state
                stateMap.is_chat_retracted = true;

                // fire any passed callback
                if (callback) { callback( jqueryMap.$chat ); }
            }
        );
        return true;
        
    }
    
    
    /* ========================== EVENT HANDLERS =========================== */
    
    // handle URI anchor changes
    function onHashChange(event) {
        
        var anchor_map_previous = copyAnchorMap(),
            anchor_map_proposed,
            _s_chat_previous,
            _s_chat_proposed,
            s_chat_proposed;
        
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
                case 'open':
                    toggleChat( true );
                    break;
                case 'closed':
                    toggleChat( false );
                    break;
                default:
                    toggleChat( false );
                    delete anchor_map_proposed.chat;
                    $.uriAnchor.setAnchor( anchor_map_proposed, null, true );
            }
        }
    }
    
    
    // click event handler to call changeAnchorPart.
    // changes the 'chat' parameter of the URI anchor on click
    function onClickChat(event) {
        
        changeAnchorPart({
            chat: ( stateMap.is_chat_retracted ? 'open' : 'closed' )
        });
        
        // prevent default action, stop propagation, conclude handler execution
        return false;
    }
    
    
    /* ========================== PUBLIC METHODS =========================== */
    
    // initialize the module
    function initModule($container) {
        
        // load html and map jQuery collections
        stateMap.$container = $container;
        $container.html( configMap.main_html );
        setJqueryMap();
        
        // init chat slider as retracted and bind click handler
        stateMap.is_chat_retracted = true;
        jqueryMap.$chat
            .attr('title', configMap.chat_retracted_title)
            .click(onClickChat);
        
        // configure uriAnchor to use our schema
        $.uriAnchor.configModule({
            schema_map: configMap.anchor_schema_map
        });
        
        // configure and init feature modules
        spa.chat.configModule({});
        spa.chat.initModule( jqueryMap.$chat );
        
        // bind 'hashchange' event & immediately fire so the module considers
        // the bookmark on page load
        $(window)
            .bind('hashchange', onHashChange)
            .trigger('hashchange');
                
    }
    
    
    /* ====================== EXPORT PUBLIC METHODS ======================== */
    
    return {
        initModule: initModule
    };
    
}(jQuery));
