/* spa.util_brwsr.js
 * Browser utilities - common routines that work only in a browser env.
 * Kudos: Michael Mikowski @ MIT License
*/

/* jshint esversion:6, browser:true */
/* globals jQuery, spa */

spa.util_brwsr = (function ($) {
    
    'use strict';
    
    /* =============================== SETUP =============================== */
    
    var configMap = {
        regex_encode_html  : /[&"'><]/g,
        regex_encode_noamp : /["'><]/g,
        html_encode_map    : {
            '&' : '&#38',
            '"' : '&#34',
            "'" : '&#39',
            '>' : '&#62',
            '<' : '&#60'
        }
    };
    
    // create modified copy of the config used to encode entities...
    configMap.encode_noamp_map = $.extend(
        {}, configMap.html_encode_map
    );
    
    // ... then remove the ampersand
    delete configMap.encode_noamp_map['&'];
    
        
    /* ========================= UTILITY METHODS =========================== */
    
    /* convert HTML entities (&amp) into their actual character (&)
     * @params    [string]   str   [input text to be converted]
     * @returns   [string]         [parsed text]
    */
    function decodeHtml(str) {
        return $('<div>').html(str || '').text();
    }
    
    
    /* convert plain characters (&) into HTML entities (&amp)
     * @params    [string]   input_arg_str   [input text to be converted]
     * @params    [boolean]  exclude_amp     [flag to include/exclude ampersands]
     * @returns   [string]                   [HTML encoded text]
    */
    function encodeHtml(input_arg_str, exclude_amp) {
        var input_str = String(input_arg_str),
            regex,
            lookup_map;
        
        if (exclude_amp) {
            lookup_map = configMap.encode_noamp_map;
            regex      = configMap.regex_encode_noamp;
        } else {
            lookup_map = configMap.html_encode_map;
            regex      = configMap.regex_encode_html;
        }
        
        return input_str.replace(regex, function(match, name) {
            return lookup_map[match] || '';
        });
    }
    
    
    /* calculate the pixel size from em units
     * @params    [object]  elem   [the DOM element under study]
     * @returns   [number]         [the size of ems in pixels]
    */
    function getEmSize(elem) {
        return Number(
            getComputedStyle(elem, '').fontSize.match(/\d*\.?\d*/)[0]
        );
    }
    
    
    /* ====================== EXPORT PUBLIC METHODS ======================== */
    
    return {
        decodeHtml : decodeHtml,
        encodeHtml : encodeHtml,
        getEmSize  : getEmSize
    };
    
}(jQuery));
