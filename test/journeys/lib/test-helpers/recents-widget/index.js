import {assert} from 'chai';

import waitForPromise from '../../wait-for-promise';

export const elements = {
  recentsWidget: '.ciscospark-spaces-list-wrapper',
  firstSpace: '.space-item:first-child',
  title: '.space-title',
  unreadIndicator: '.space-unread-indicator',
  lastActivity: '.space-last-activity',
  callButton: 'button[aria-label="Call Space"]',
  answerButton: 'button[aria-label="Answer"]'
};

/**
 * Sends a message to a space and verifies that it is received and displayed
 *
 * @export
 * @param {object} aBrowser
 * @param {object} sender - Person with spark object
 * @param {object} conversation
 * @param {string} message
 * @param {boolean} [isOneOnOne=false]
 * @returns {undefined}
 */
export function displayIncomingMessage(aBrowser, sender, conversation, message, isOneOnOne = false) {
  const spaceTitle = isOneOnOne ? sender.displayName : conversation.displayName;
  waitForPromise(sender.spark.internal.conversation.post(conversation, {
    displayName: message,
    content: message
  }));
  browser.waitUntil(() =>
    aBrowser.getText(`${elements.firstSpace} ${elements.title}`) === spaceTitle
    , 5000, 'conversation not displayed');
  browser.waitUntil(() =>
    aBrowser.getText(`${elements.firstSpace} ${elements.lastActivity}`).includes(message)
    , 5000, 'does not have last message displayed');
  assert.isTrue(aBrowser.isVisible(`${elements.firstSpace} ${elements.unreadIndicator}`), 'does not have unread indicator');
}

/**
 * Sends a message to a space and verifies that it is received and displayed,
 * then marks it read.
 *
 * @export
 * @param {object} aBrowser
 * @param {object} sender - Person with spark object
 * @param {object} receiver - Person with spark object
 * @param {object} conversation
 * @param {string} message
 * @returns {undefined}
 */
export function displayAndReadIncomingMessage(aBrowser, sender, receiver, conversation, message) {
  let activity;
  waitForPromise(sender.spark.internal.conversation.post(conversation, {
    displayName: message
  }).then((a) => {
    activity = a;
  }));
  browser.waitUntil(() =>
    aBrowser.getText(`${elements.firstSpace} ${elements.lastActivity}`).includes(message),
  5000,
  'does not have last message sent');
  assert.isTrue(aBrowser.isVisible(`${elements.firstSpace} ${elements.unreadIndicator}`), 'does not have unread indicator');
  // Acknowledge the activity to mark it read
  waitForPromise(receiver.spark.internal.conversation.acknowledge(conversation, activity));
  browser.waitUntil(() =>
    !aBrowser.isVisible(`${elements.firstSpace} ${elements.unreadIndicator}`),
  5000,
  'does not remove unread indicator');
}

/**
 * Creates a new space and posts a message to it, then verifies
 * space is displayed properly
 *
 * @export
 * @param {object} aBrowser
 * @param {object} sender
 * @param {array} participants
 * @param {string} roomTitle
 * @param {string} firstPost
 * @param {boolean} [isOneOnOne=false]
 * @returns {undefined}
 */
export function createSpaceAndPost(aBrowser, sender, participants, roomTitle, firstPost, isOneOnOne = false) {
  const spaceTitle = isOneOnOne ? sender.displayName : roomTitle;
  let conversation;
  const createOptions = {
    participants
  };
  if (roomTitle) {
    createOptions.displayName = roomTitle;
  }
  waitForPromise(sender.spark.internal.conversation.create(createOptions)
    .then((c) => {
      conversation = c;
      return sender.spark.internal.conversation.post(c, {
        displayName: firstPost
      });
    }));
  browser.waitUntil(() =>
    aBrowser.getText(`${elements.firstSpace} ${elements.title}`).includes(spaceTitle),
  5000,
  'does not display newly created space title');
  browser.waitUntil(() =>
    aBrowser.getText(`${elements.firstSpace} ${elements.lastActivity}`).includes(firstPost),
  5000,
  'does not have last message sent');
  return conversation;
}
