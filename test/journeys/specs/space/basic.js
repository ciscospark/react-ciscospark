/* eslint-disable max-nested-callbacks */

import {assert} from 'chai';

import testUsers from '@ciscospark/test-helper-test-users';
import CiscoSpark from '@ciscospark/spark-core';
import '@ciscospark/internal-plugin-conversation';

describe(`Widget Space`, () => {
  const browserLocal = browser.select(`browserLocal`);
  let marty;
  let conversation, participants;
  process.env.CISCOSPARK_SCOPE = [
    `webexsquare:get_conversation`,
    `spark:people_read`,
    `spark:rooms_read`,
    `spark:rooms_write`,
    `spark:memberships_read`,
    `spark:memberships_write`,
    `spark:messages_read`,
    `spark:messages_write`,
    `spark:teams_read`,
    `spark:teams_write`,
    `spark:team_memberships_read`,
    `spark:team_memberships_write`,
    `spark:kms`
  ].join(` `);

  before(`load browsers`, () => {
    browser
      .url(`/`)
      .execute(() => {
        localStorage.clear();
      });
  });

  before(`create users`, () => testUsers.create({count: 3})
    .then((users) => {
      participants = users;
      marty = users[0];

      marty.spark = new CiscoSpark({
        credentials: {
          authorization: marty.token
        }
      });

      return marty.spark.internal.mercury.connect();
    }));

  before(`pause to let test users establish`, () => browser.pause(5000));

  after(`disconnect`, () => marty.spark.internal.mercury.disconnect());

  before(`create space`, () => marty.spark.internal.conversation.create({
    displayName: `Test Widget Space`,
    participants
  }).then((c) => {
    conversation = c;
    return conversation;
  }));

  before(`inject token`, () => {
    const spaceWidget = `.ciscospark-space-widget`;
    browserLocal.execute((localAccessToken, spaceId) => {
      const options = {
        accessToken: localAccessToken,
        spaceId
      };
      window.openSpaceWidget(options);
    }, marty.token.access_token, conversation.id);
    browserLocal.execute((c) => {
      console.log(c);
    }, conversation);
    browserLocal.waitForVisible(spaceWidget);
  });

  it(`loads the test page`, () => {
    const title = browserLocal.getTitle();
    assert.equal(title, `Cisco Spark Widget Test`);
  });

  it(`loads the space name`, () => {
    browserLocal.waitForVisible(`h1.ciscospark-title`);
    assert.equal(browserLocal.getText(`h1.ciscospark-title`), conversation.displayName);
  });

  describe(`Activity Menu`, () => {
    const menuButton = `button[aria-label="Main Menu"]`;
    const exitButton = `.ciscospark-activity-menu-exit button`;
    const messageButton = `button[aria-label="Message"]`;
    const activityMenu = `.ciscospark-activity-menu`;
    const controlsContainer = `.ciscospark-controls-container`;
    const messageWidget = `.ciscospark-message-wrapper`;
    it(`has a menu button`, () => {
      assert.isTrue(browserLocal.isVisible(menuButton));
    });

    it(`displays the menu when clicking the menu button`, () => {
      browserLocal.click(menuButton);
      browserLocal.waitForVisible(activityMenu);
    });

    it(`has an exit menu button`, () => {
      assert.isTrue(browserLocal.isVisible(activityMenu));
      browserLocal.waitForVisible(exitButton);
    });

    it(`closes the menu with the exit button`, () => {
      browserLocal.click(exitButton);
      browserLocal.waitForVisible(activityMenu, 1500, true);
    });

    it(`has a message button`, () => {
      browserLocal.click(menuButton);
      browserLocal.element(controlsContainer).element(messageButton).waitForVisible();
    });

    it(`hides menu and switches to message widget`, () => {
      browserLocal.element(controlsContainer).element(messageButton).click();
      browserLocal.waitForVisible(activityMenu, 1500, true);
      assert.isTrue(browserLocal.isVisible(messageWidget));
    });

  });

});
