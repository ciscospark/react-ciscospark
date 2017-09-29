import {assert} from 'chai';

import {switchToMeet} from './main';
import {getEventLog} from '../../events';
import {constructHydraId} from '../../hydra';

export const elements = {
  meetWidget: `.ciscospark-meet-wrapper`,
  messageWidget: `.ciscospark-message-wrapper`,
  callButton: `button[aria-label="Call"]`,
  answerButton: `button[aria-label="Answer"]`,
  declineButton: `button[aria-label="Decline"]`,
  hangupButton: `button[aria-label="Hangup"]`,
  callControls: `.call-controls`,
  remoteVideo: `.remote-video video`
};

/**
 * Answers call on specified browser
 * @param {Object} aBrowser
 * @returns {void}
 */
export function answer(aBrowser) {
  aBrowser.element(elements.meetWidget).element(elements.answerButton).click();
  aBrowser.waitForVisible(elements.remoteVideo);
  // Let call elapse 5 seconds before hanging up
  aBrowser.pause(5000);
}

/**
 * Begins call between two browsers
 * @param {Object} caller
 * @param {Object} reciever
 * @returns {void}
 */
export function call(caller, reciever) {
  caller.moveToObject(elements.meetWidget);
  caller.element(elements.meetWidget).element(elements.callButton).waitForVisible();
  caller.element(elements.meetWidget).element(elements.callButton).click();
  // wait for call to establish
  reciever.waitForVisible(elements.answerButton);
}

/**
 * Declines incoming call on specified browser
 * @param {Object} aBrowser
 * @returns {void}
 */
export function decline(aBrowser) {
  aBrowser.waitForVisible(elements.declineButton);
  aBrowser.element(elements.meetWidget).element(elements.declineButton).click();
  aBrowser.element(elements.meetWidget).element(elements.callButton).waitForVisible();
}

/**
 * Hangs up call on specified browser
 * @param {Object} aBrowser
 * @returns {void}
 */
export function hangup(aBrowser) {
  // Call controls currently has a hover state
  aBrowser.moveToObject(elements.meetWidget);
  aBrowser.waitForVisible(elements.callControls);
  aBrowser.element(elements.meetWidget).element(elements.hangupButton).click();
}

/**
 * Test to hangup call before reciever answers
 * @param {Object} browserLocal
 * @param {Object} browserRemote
 * @returns {void}
 */
export function hangupBeforeAnswerTest(browserLocal, browserRemote) {
  switchToMeet(browserLocal);
  call(browserLocal, browserRemote);
  hangup(browserLocal);
  browserRemote.element(elements.meetWidget).element(elements.callButton).waitForVisible();
}

/**
 * Test to decline incoming call
 * @param {Object} browserLocal
 * @param {Object} browserRemote
 * @returns {void}
 */
export function declineIncomingCallTest(browserLocal, browserRemote) {
  switchToMeet(browserRemote);
  call(browserRemote, browserLocal);
  decline(browserLocal);
  browserRemote.element(elements.meetWidget).element(elements.callButton).waitForVisible();
  // Pausing to let locus session flush
  browserLocal.pause(10000);
}

/**
 * Test to hangup during ongoing call
 * @param {Object} browserLocal
 * @param {Object} browserRemote
 * @returns {void}
 */
export function hangupDuringCallTest(browserLocal, browserRemote) {
  switchToMeet(browserLocal);
  call(browserLocal, browserRemote);
  answer(browserRemote);
  hangup(browserLocal);
  browserLocal.waitForVisible(elements.messageWidget);
  // Should switch back to message widget after hangup
  browserLocal.waitForVisible(elements.messageWidget);
}

/**
 * Test to verify browser has proper call events
 * @param {Object} browserLocal
 * @param {Object} browserRemote
 * @param {Object} spock
 * @returns {void}
 */
export function callEventTest(browserLocal, browserRemote, spock) {
  const events = getEventLog(browserLocal);
  const eventCreated = events.find((event) => event.eventName === `calls:created`);
  const eventConnected = events.find((event) => event.eventName === `calls:connected`);
  const eventDisconnected = events.find((event) => event.eventName === `calls:disconnected`);
  assert.isDefined(eventCreated, `has a calls ringing event`);
  assert.isDefined(eventConnected, `has a calls connected event`);
  assert.isDefined(eventDisconnected, `has a calls disconnected event`);
  assert.containsAllKeys(eventCreated.detail, [`resource`, `event`, `actorId`, `data`]);
  assert.containsAllKeys(eventConnected.detail, [`resource`, `event`, `actorId`, `data`]);
  assert.containsAllKeys(eventDisconnected.detail, [`resource`, `event`, `actorId`, `data`]);
  assert.containsAllKeys(eventCreated.detail.data, [`actorName`, `roomId`]);
  assert.containsAllKeys(eventConnected.detail.data, [`actorName`, `roomId`]);
  assert.containsAllKeys(eventDisconnected.detail.data, [`actorName`, `roomId`]);
  assert.equal(eventCreated.detail.actorId, constructHydraId(`PEOPLE`, spock.id));
  assert.equal(eventConnected.detail.actorId, constructHydraId(`PEOPLE`, spock.id));
  assert.equal(eventDisconnected.detail.actorId, constructHydraId(`PEOPLE`, spock.id));
  assert.equal(eventCreated.detail.data.actorName, spock.displayName);
  assert.equal(eventConnected.detail.data.actorName, spock.displayName);
  assert.equal(eventDisconnected.detail.data.actorName, spock.displayName);
}
