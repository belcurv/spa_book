/* spa.shell.js
   Shell module for SPA
*/

/* jshint esversion:6 */
/* globals jQuery, spa */

spa.shell = (function ($) {
    
    'use strict';
    
    /* ==================== INIT MODULE SCOPE VARIABLES ==================== */
    
    var 
    
        // static configuration values
        configMap = {
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
            is_chat_retracted : true   // set by toggleChat method
        },
        
        // jQuery collections cache container
        jqueryMap = {};
        
    
    /* ========================== UTILITY METHODS ========================== */
    
        
    /* ============================ DOM METHODS ============================ */
    
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
    
    // click event handler to call toggleChat
    function onClickChat(event) {
        
        // if toggleChat succeeds (returns true), update the URI anchor.
        // note that calling it inside the condition executed it
        if (toggleChat( stateMap.is_chat_retracted )) {
            $.uriAnchor.setAnchor({
                chat: ( stateMap.is_chat_retracted ? 'open' : 'closed' )
            });
        }
        
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
        
        // test toggle
        // setTimeout( function () {toggleChat( true ); }, 3000 );
        // setTimeout( function () {toggleChat( false ); }, 8000 );
        
    }
    
    
    /* ====================== EXPORT PUBLIC METHODS ======================== */
    
    return {
        initModule: initModule
    };
    
}(jQuery));
