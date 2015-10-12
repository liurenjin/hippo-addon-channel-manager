/*
 *  Copyright 2011-2015 Hippo B.V. (http://www.onehippo.com)
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

/**
 * Hippo.Msg is decorating Ext.Msg and makes alert, confirm and prompt blocking.
 * If a blocking message is waiting for user interaction, new fired messages will be queued
 * (e. g. important for asynchronous requests which could trigger hide while we are waiting for user input).
 */

Hippo.Msg = (function () {
  "use strict";

  var msgQueue = [],
    blockingType = [],
    blocked = false,
    waitTimeout,
    func;

  blockingType.alert = true;
  blockingType.confirm = true;
  blockingType.prompt = true;
  blockingType.show = false;
  blockingType.wait = false;
  blockingType.hide = false;

  func = function (type, args) {
    var dialog,
      buttons,
      oldCallback,
      scope;

    if (blocked) {
      if (blockingType[type]) {
        msgQueue.push(function () {
          func.apply(this, args);
        });
      }
      return;
    }

    if (blockingType[type]) {
      blocked = true;

      if (args.length >= 3) {
        oldCallback = args[2];
        scope = this;

        if (args.length >= 4) {
          scope = args[3];
        }

        args[2] = function () {
          var nextMessage;

          if (typeof oldCallback === 'function') {
            oldCallback.apply(scope, arguments);
          }

          blocked = false;

          if (msgQueue.length > 0) {
            nextMessage = msgQueue.shift();
            nextMessage();
          }
        };
      }
    }
    Ext.Msg[type].apply(Ext.Msg, args);

    // Add css classes to dialog buttons
    dialog = Ext.Msg.getDialog();
    buttons = dialog.fbar.items;

    buttons.each(function (button) {
      button.addClass('btn').addClass('btn-default').addClass('qa-message-button');
    });
  };

  return {
    alert: function () {
      func('alert', arguments);
    },
    confirm: function () {
      func('confirm', arguments);
    },
    prompt: function () {
      func('prompt', arguments);
    },
    show: function () {
      func('show', arguments);
    },
    wait: function () {
      if (waitTimeout) {
        return;
      }
      var args = arguments;
      waitTimeout = window.setTimeout(function () {
        waitTimeout = null;
        func('wait', args);
      }, 500);
    },
    hide: function () {
      if (waitTimeout) {
        window.clearTimeout(waitTimeout);
        waitTimeout = null;
      }
      func('hide', arguments);
    }
  };
}());
