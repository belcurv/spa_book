/* spa.chat.js
 * Chat feature module for SPA
*/

/* jshint esversion:6, browser:true */
/* globals jQuery, spa */

spa.chat = (function ($) {
    
    'use strict';
    
    /* ==================== INIT MODULE SCOPE VARIABLES ==================== */
    
    var 
    
        // static configuration values
        configMap = {
            
            // html template
            main_html: `
                <div class="spa-chat">
                    <div class="spa-chat-head">
                        <div class="spa-chat-head-toggle">+</div>
                        <div class="spa-chat-head-title">Chat</div>
                    </div>
                    <div class="spa-chat-closer">x</div>
                    <div class="spa-chat-sizer">
                        <div class="spa-chat-msgs"></div>
                        <div class="spa-chat-box">
                            <input type="text">
                            <div>send</div>
                        </div>
                    </div>
                </div>`,
            
            // permitted chat settings
            settable_map: {
                slider_open_time    : true,
                slider_close_time   : true,
                slider_opened_em    : true,
                slider_closed_em    : true,
                slider_opened_title : true,
                slider_closed_title : true,
                chat_model          : true,
                people_model        : true,
                set_chat_anchor     : true
            },
            
            // slider animation settings
            slider_open_time        : 250,
            slider_close_time       : 250,
            // slider_opened_em        : 18,  // now set in setPxSizes()
            slider_closed_em        : 2,
            slider_opened_min_em    : 10,
            window_height_min_em    : 20,
            slider_opened_title     : 'Click to close',
            slider_closed_title     : 'Click to open',
            
            // placeholders
            chat_model              : null,
            people_model            : null,
            set_chat_anchor         : null
            
        },
        
        // dynamic information shared throughout module
        stateMap = {
            $append_target   : null,
            position_type    : 'closed',
            px_per_em        : 0,
            slider_hidden_px : 0,
            slider_closed_px : 0,
            slider_opened_px : 0
        },
        
        // jQuery collections cache container
        jqueryMap = {};
        
    
    /* ========================== UTILITY METHODS ========================== */
    
    /* converts 'em' units to pixels so we can use measurements in jQuery
     * @params   [object]   elem   [the jQuery DOM element collection]
     * @returns  [number]          [computed pixels]
    */
    function getEmSize(elem) {
        return Number(
            getComputedStyle(elem, '').fontSize.match(/\d*\.?\d*/)[0]
        );
    }
        
    /* ============================ DOM METHODS ============================ */
    
    /* cache jQuery collections to reduce DOM traversals & improve performance
    */
    function setJqueryMap() {
        var $append_target = stateMap.$append_target,
            $slider = $append_target.find('.spa-chat');
        
        jqueryMap = {
            $slider : $slider,
            $head   : $slider.find('.spa-chat-head'),
            $toggle : $slider.find('.spa-chat-head-toggle'),
            $title  : $slider.find('.spa-chat-head-title'),
            $sizer  : $slider.find('.spa-chat-sizer'),
            $msgs   : $slider.find('.spa-chat-msgs'),
            $box    : $slider.find('.spa-chat-box'),
            $input  : $slider.find('.spa-chat-input input[type=text]')
        };
    }
    
    /* calculate and set pixel sizes for elements managed by this module
    */
    function setPxSizes() {
        var opened_height_em,
            px_per_em        = getEmSize(jqueryMap.$slider.get(0)),
            window_height_em = Math.floor(
                ( $(window).height() / px_per_em ) + 0.5
            );
        
        // compare current window height to configMap threshold,
        // set slider opened height
        opened_height_em = window_height_em > configMap.window_height_min_em ?
            window_height_em - 4 : configMap.slider_opened_min_em;
        
        stateMap.px_per_em = px_per_em;
        stateMap.slider_closed_px = configMap.slider_closed_em * px_per_em;
        stateMap.slider_opened_px = opened_height_em * px_per_em;
        jqueryMap.$sizer.css({
            height: (opened_height_em - 2) * px_per_em
        });        
    }
    
    
    /* ========================== EVENT HANDLERS =========================== */
    
    /* event handler to change URI anchor.
     * spa.shell.js deals with subsequent 'hashchange' event
    */
    function onClickToggle(event) {
        var set_chat_anchor = configMap.set_chat_anchor;
        if (stateMap.position_type === 'opened') {
            set_chat_anchor('closed');
        } else if (stateMap.position_type === 'closed') {
            set_chat_anchor('opened');
        }
        return false;
    }
    
    
    /* ========================== PUBLIC METHODS =========================== */
    
    /* removeSlider
    
       Purpose: removes chatSlider DOM element, reverts to initial state, and
                removes pointers to callbacks and other data
       Arguments : none
       Returns   : true
       Throws    : none
    */
    function removeSlider() {
        // unwind initialization and state
        // remove DOM container; this removes event bindins too
        if (jqueryMap.$slider) {
            jqueryMap.$slider.remove();
            jqueryMap = {};
        }
        stateMap.$append_target = null;
        stateMap.position_type = 'closed';
        
        // unwind key configurations
        configMap.chat_model      = null;
        configMap.people_model    = null;
        configMap.set_chat_anchor = null;
        
        return true;
    }
    
    
    /* handleResize - called by spa.shell.js 'onResize' event handler
    
       Purpose : Given a window resize event, adjust the presentation provided
                 by this module if needed
       Actions : If window height or width falls below threshold, resize the
                 chat slider for the reduced window size
       Returns :
         * true  - resize considered
         * false - resize not considered
       Throws  : none
    */
    function handleResize() {
        
        // do nothing if we don't have a slider container
        if (!jqueryMap.$slider) { return false; }
        
        // recalculate pixel sizes each time handleResize is called
        setPxSizes();
        
        // resize opened slider height 
        if (stateMap.position_type === 'opened') {
            jqueryMap.$slider.css({ height : stateMap.slider_opened_px });
        }
        
        return true;
        
    }
    
    
    /* configModule - uses: 'spa.util.setConfigMap' utility method
    
       Example use : spa.chat.configModule({ slider_open_em: 18 });
       Purpose     : Configure the module prior to initialization
       Arguments   :
         * set_chat_anchor - a callback to modify the URI anchor to indicate
           opened or closed state. This callback must return false if the
           requested state cannot be met
         * chat_model - the chat model object which provides methods to
           interact with our instant messaging
         * people_model - the people model object which provides methods to
           manage the list of people the model maintains
         * slider_* settings. All these are optional scalars.
           See mapConfig.settable_map for a full list.
           Example: slider_open_em is the open height in em's
       Action  :
         The internal configuration data structure (configMap) is updated
         with provided arguments.
       Returns : true
       Throws  : JavaScript error object and stack trace on unacceptable or
                 missing arguments
    */
    function configModule(input_map) {
        spa.util.setConfigMap({
            input_map    : input_map,
            settable_map : configMap.settable_map,
            config_map   : configMap
        });
        return true;
    }
    
    
    /* setSliderPosition
    
       Example use : spa.chat.setSliderPosition( 'closed' );
       Purpose     : Ensure chat slider is in the requested state
       Arguments   :
         * position_type - enum('closed', 'opened', or 'hidden')
         * callback - optional callback at the end of animation.
           (callback receives the slider DOM element as an argument)
       Action  :
         Leaves slider in current state if it matches requested, otherwise
         animate to requested state.
       Returns :
         * true  - requested state achieved
         * false - requested state not achieved
       Throws  : none
    */
    function setSliderPosition(position_type, callback) {
        
        // init vars
        var height_px, animate_time, slider_title, toggle_text;
        
        // return true if slider already in requested position
        if (stateMap.position_type === position_type) {
            return true;
        }
        
        // set animation parameters based on position_type param
        switch (position_type) {
            case 'opened':
                height_px    = stateMap.slider_opened_px;
                animate_time = configMap.slider_open_time;
                slider_title = configMap.slider_opened_title;
                toggle_text  = '=';
                break;
                
            case 'hidden':
                height_px    = 0;
                animate_time = configMap.slider_open_time;
                slider_title = '';
                toggle_text  = '+';
                break;
                
            case 'closed':
                height_px    = stateMap.slider_closed_px;
                animate_time = configMap.slider_close_time;
                slider_title = configMap.slider_closed_title;
                toggle_text  = '+';
                break;
                
            default:
                // fail on unknown position_type
                return false;
        }
        
        // animate slider position change
        stateMap.position_type = '';
        jqueryMap.$slider.animate(
            { height : height_px },
            animate_time,
            function() {
                jqueryMap.$toggle.prop('title', slider_title);
                jqueryMap.$toggle.text(toggle_text);
                stateMap.position_type = position_type;
                if (callback) { callback(jqueryMap.$slider); }
            }
        );
        return true;        
    }
    
    
    /* initModule
    
       Example use : spa.chat.initModule( $('#div_id') );
       Purpose     : Directs Chat to offer its capability to the user
       Arguments   :
         * $append_target - the jQuery DOM container for this feature module.
           Example: $('#div_id)
       Action     : Appends the chat slider to the provided container and
                    fills it wiht HTML content. It then initializes elements,
                    events, and handlers to provide the user with a chat-room
                    interface
       Returns    : true on success, false on failure
       Throws     : none
    */
    function initModule($append_target) {
        $append_target.append( configMap.main_html );  // fill chat slider with our template
        stateMap.$append_target = $append_target;
        setJqueryMap();
        setPxSizes();
        
        // init chat slider to default title & state
        jqueryMap.$toggle.prop('title', configMap.slider_closed_title);
        jqueryMap.$head.click(onClickToggle);
        stateMap.position_type = 'closed';
        
        return true;
    }
    
    
    /* ====================== EXPORT PUBLIC METHODS ======================== */
    
    return {
        setSliderPosition : setSliderPosition,
        configModule      : configModule,
        initModule        : initModule,
        removeSlider      : removeSlider,
        handleResize      : handleResize
    };

}(jQuery));
