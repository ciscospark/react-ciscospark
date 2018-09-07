import testUsers from '@ciscospark/test-helper-test-users';
import CiscoSpark from '@ciscospark/spark-core';
import '@ciscospark/internal-plugin-conversation';

import {updateJobStatus} from '../../../lib/test-helpers';
import {elements} from '../../../lib/test-helpers/space-widget/main.js';
import {answer, hangup} from '../../../lib/test-helpers/space-widget/meet.js';

describe('Widget Space: One on One: Data API Settings', () => {
  const browserLocal = browser.select('browserLocal');
  const browserRemote = browser.select('browserRemote');
  const jobName = 'react-widget-oneOnOne-dataApi';
  let allPassed = true;
  let mccoy, spock;

  before('load browsers', () => {
    browser.url('/data-api/space.html');
  });

  before('create spock', () => testUsers.create({count: 1, config: {displayName: 'Mr Spock'}})
    .then((users) => {
      [spock] = users;
      spock.spark = new CiscoSpark({
        credentials: {
          authorization: spock.token
        },
        config: {
          logger: {
            level: 'error'
          }
        }
      });
      return spock.spark.internal.mercury.connect();
    }));

  before('create mccoy', () => testUsers.create({count: 1, config: {displayName: 'Bones Mccoy'}})
    .then((users) => {
      [mccoy] = users;
      mccoy.spark = new CiscoSpark({
        credentials: {
          authorization: mccoy.token
        },
        config: {
          logger: {
            level: 'error'
          }
        }
      });
      return mccoy.spark.internal.mercury.connect();
    }));

  before('pause to let test users establish', () => browser.pause(5000));

  describe('destination type: userId', () => {
    it('opens widget', () => {
      browserLocal.execute((localAccessToken, localToPersonId) => {
        const csmmDom = document.createElement('div');
        csmmDom.setAttribute('class', 'ciscospark-widget');
        csmmDom.setAttribute('data-toggle', 'ciscospark-space');
        csmmDom.setAttribute('data-access-token', localAccessToken);
        csmmDom.setAttribute('data-destination-id', localToPersonId);
        csmmDom.setAttribute('data-destination-type', 'userId');
        document.getElementById('ciscospark-widget').appendChild(csmmDom);
        window.loadBundle('/dist-space/bundle.js');
      }, spock.token.access_token, mccoy.id);

      browserLocal.waitForVisible(elements.messageWidget);
      browserLocal.waitForVisible(`[placeholder="Send a message to ${mccoy.displayName}"]`);
      browserLocal.refresh();
    });
  });

  describe('initial activity setting: meet', () => {
    before('inject token', () => {
      browserLocal.execute((localAccessToken, localToUserEmail) => {
        const csmmDom = document.createElement('div');
        csmmDom.setAttribute('class', 'ciscospark-widget');
        csmmDom.setAttribute('data-toggle', 'ciscospark-space');
        csmmDom.setAttribute('data-access-token', localAccessToken);
        csmmDom.setAttribute('data-destination-id', localToUserEmail);
        csmmDom.setAttribute('data-destination-type', 'email');
        csmmDom.setAttribute('data-initial-activity', 'meet');
        document.getElementById('ciscospark-widget').appendChild(csmmDom);
        window.loadBundle('/dist-space/bundle.js');
      }, spock.token.access_token, mccoy.email);
      browserLocal.waitForVisible(elements.meetWidget);
    });

    it('opens meet widget', () => {
      browserLocal.waitForVisible(elements.meetButton);
      browserLocal.refresh();
    });
  });

  describe('initial activity setting: message', () => {
    before('inject token', () => {
      browserLocal.execute((localAccessToken, localToUserEmail) => {
        const csmmDom = document.createElement('div');
        csmmDom.setAttribute('class', 'ciscospark-widget');
        csmmDom.setAttribute('data-toggle', 'ciscospark-space');
        csmmDom.setAttribute('data-access-token', localAccessToken);
        csmmDom.setAttribute('data-destination-id', localToUserEmail);
        csmmDom.setAttribute('data-destination-type', 'email');
        csmmDom.setAttribute('data-initial-activity', 'message');
        document.getElementById('ciscospark-widget').appendChild(csmmDom);
        window.loadBundle('/dist-space/bundle.js');
      }, spock.token.access_token, mccoy.email);
    });

    it('opens message widget', () => {
      browserLocal.waitForVisible(elements.messageWidget);
      browserLocal.waitForVisible(`[placeholder="Send a message to ${mccoy.displayName}"]`);
      browserLocal.refresh();
    });
  });

  describe('opens using legacy toPersonEmail', () => {
    before('inject token', () => {
      browserLocal.execute((localAccessToken, localToUserEmail) => {
        const csmmDom = document.createElement('div');
        csmmDom.setAttribute('class', 'ciscospark-widget');
        csmmDom.setAttribute('data-toggle', 'ciscospark-space');
        csmmDom.setAttribute('data-access-token', localAccessToken);
        csmmDom.setAttribute('data-to-person-email', localToUserEmail);
        csmmDom.setAttribute('data-initial-activity', 'meet');
        document.getElementById('ciscospark-widget').appendChild(csmmDom);
        window.loadBundle('/dist-space/bundle.js');
      }, spock.token.access_token, mccoy.email);
      browserLocal.waitForVisible(elements.meetWidget);
    });

    it('opens meet widget', () => {
      browserLocal.waitForVisible(elements.meetButton);
      browserLocal.refresh();
    });
  });

  describe('start call setting', () => {
    before('inject token', () => {
      browserRemote.execute((localAccessToken, localToUserEmail) => {
        const csmmDom = document.createElement('div');
        csmmDom.setAttribute('class', 'ciscospark-widget');
        csmmDom.setAttribute('data-toggle', 'ciscospark-space');
        csmmDom.setAttribute('data-access-token', localAccessToken);
        csmmDom.setAttribute('data-destination-id', localToUserEmail);
        csmmDom.setAttribute('data-destination-type', 'email');
        csmmDom.setAttribute('data-initial-activity', 'message');
        document.getElementById('ciscospark-widget').appendChild(csmmDom);
        window.loadBundle('/dist-space/bundle.js');
      }, mccoy.token.access_token, spock.email);
      browserRemote.waitForVisible(elements.messageWidget);
      browserRemote.waitForVisible(`[placeholder="Send a message to ${spock.displayName}"]`);
    });

    before('inject token', () => {
      browserLocal.execute((localAccessToken, localToUserEmail) => {
        const csmmDom = document.createElement('div');
        csmmDom.setAttribute('class', 'ciscospark-widget');
        csmmDom.setAttribute('data-toggle', 'ciscospark-space');
        csmmDom.setAttribute('data-access-token', localAccessToken);
        csmmDom.setAttribute('data-destination-id', localToUserEmail);
        csmmDom.setAttribute('data-destination-type', 'email');
        csmmDom.setAttribute('data-initial-activity', 'meet');
        csmmDom.setAttribute('data-start-call', true);
        document.getElementById('ciscospark-widget').appendChild(csmmDom);
        window.loadBundle('/dist-space/bundle.js');
      }, spock.token.access_token, mccoy.email);
      browserLocal.waitForVisible(elements.meetWidget);
    });

    it('starts call when set to true', () => {
      browser.pause(5000);
      answer(browserRemote);
      hangup(browserRemote);
      browser.refresh();
    });
  });


  /* eslint-disable-next-line func-names */
  afterEach(function () {
    allPassed = allPassed && (this.currentTest.state === 'passed');
  });

  after(() => {
    updateJobStatus(jobName, allPassed);
  });
});
