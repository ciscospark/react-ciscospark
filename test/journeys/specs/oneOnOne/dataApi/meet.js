import testUsers from '@ciscospark/test-helper-test-users';
import '@ciscospark/plugin-phone';

import {switchToMeet} from '../../../lib/test-helpers/space-widget/main';
import {elements, hangupBeforeAnswerTest, declineIncomingCallTest, hangupDuringCallTest} from '../../../lib/test-helpers/space-widget/meet';

describe('Widget Space: One on One', () => {
  describe('Data API', () => {
    const browserLocal = browser.select('browserLocal');
    const browserRemote = browser.select('browserRemote');
    let mccoy, spock;

    before('initialize', () => {
      browserLocal
        .url('/data-api/space.html')
        .execute(() => {
          localStorage.clear();
        });
      testUsers.create({count: 1, config: {displayName: 'Mr Spock'}})
        .then((users) => {
          [spock] = users;
        });

      testUsers.create({count: 1, config: {displayName: 'Bones Mccoy'}})
        .then((users) => {
          [mccoy] = users;
        });

      browser.pause(5000);

      browserLocal.execute((localAccessToken, localToUserEmail) => {
        const csmmDom = document.createElement('div');
        csmmDom.setAttribute('class', 'ciscospark-widget');
        csmmDom.setAttribute('data-toggle', 'ciscospark-space');
        csmmDom.setAttribute('data-access-token', localAccessToken);
        csmmDom.setAttribute('data-to-person-email', localToUserEmail);
        csmmDom.setAttribute('data-initial-activity', 'message');
        document.getElementById('ciscospark-widget').appendChild(csmmDom);
        window.loadBundle('/dist-space/bundle.js');
      }, spock.token.access_token, mccoy.email);
      browserLocal.waitForVisible(`[placeholder="Send a message to ${mccoy.displayName}"]`);

      browserRemote.execute((localAccessToken, localToUserEmail) => {
        const csmmDom = document.createElement('div');
        csmmDom.setAttribute('class', 'ciscospark-widget');
        csmmDom.setAttribute('data-toggle', 'ciscospark-space');
        csmmDom.setAttribute('data-access-token', localAccessToken);
        csmmDom.setAttribute('data-to-person-email', localToUserEmail);
        csmmDom.setAttribute('data-initial-activity', 'message');
        csmmDom.setAttribute('on-event', 'message');
        document.getElementById('ciscospark-widget').appendChild(csmmDom);
        window.loadBundle('/dist-space/bundle.js');
      }, mccoy.token.access_token, spock.email);
      browserRemote.waitForVisible(`[placeholder="Send a message to ${spock.displayName}"]`);
    });

    describe('meet widget', () => {
      describe('pre call experience', () => {
        it('has a call button', () => {
          switchToMeet(browserLocal);
          browserLocal.waitForVisible(`${elements.meetWidget} ${elements.callButton}`);
        });
      });

      describe('during call experience', () => {
        it('can hangup before answer', () => {
          hangupBeforeAnswerTest(browserLocal, browserRemote);
        });

        it('can decline an incoming call', () => {
          declineIncomingCallTest(browserLocal, browserRemote);
        });

        it('can hangup in call', () => {
          hangupDuringCallTest(browserLocal, browserRemote);
        });
      });
    });
  });
});
