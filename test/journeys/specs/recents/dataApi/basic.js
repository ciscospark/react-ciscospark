import {assert} from 'chai';

import testUsers from '@ciscospark/test-helper-test-users';
import '@ciscospark/plugin-logger';
import CiscoSpark from '@ciscospark/spark-core';
import '@ciscospark/internal-plugin-conversation';

import {
  createSpaceAndPost,
  displayAndReadIncomingMessage,
  displayIncomingMessage,
  elements
} from '../../../lib/test-helpers/recents-widget';

describe(`Widget Recents`, () => {
  describe(`Data API`, () => {
    const browserLocal = browser.select(`browserLocal`);
    let docbrown, lorraine, marty;
    let conversation, oneOnOneConversation;
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

    before(`load browser`, () => {
      browserLocal
        .url(`/data-api/recents.html`)
        .execute(() => {
          localStorage.clear();
        });
    });

    before(`create marty`, () => testUsers.create({count: 1, config: {displayName: `Marty McFly`}})
      .then((users) => {
        [marty] = users;
        marty.spark = new CiscoSpark({
          credentials: {
            authorization: marty.token
          },
          config: {
            logger: {
              level: `error`
            }
          }
        });
        return marty.spark.internal.mercury.connect();
      }));

    before(`create docbrown`, () => testUsers.create({count: 1, config: {displayName: `Emmett Brown`}})
      .then((users) => {
        [docbrown] = users;
        docbrown.spark = new CiscoSpark({
          credentials: {
            authorization: docbrown.token
          },
          config: {
            logger: {
              level: `error`
            }
          }
        });
        return docbrown.spark.internal.mercury.connect();
      }));

    before(`create lorraine`, () => testUsers.create({count: 1, config: {displayName: `Lorraine Baines`}})
      .then((users) => {
        [lorraine] = users;
        lorraine.spark = new CiscoSpark({
          credentials: {
            authorization: lorraine.token
          },
          config: {
            logger: {
              level: `error`
            }
          }
        });
        return lorraine.spark.internal.mercury.connect();
      }));

    before(`pause to let test users establish`, () => browser.pause(5000));

    after(`disconnect`, () => Promise.all([
      marty.spark.internal.mercury.disconnect(),
      lorraine.spark.internal.mercury.disconnect(),
      docbrown.spark.internal.mercury.disconnect()
    ]));

    before(`create group space`, () => marty.spark.internal.conversation.create({
      displayName: `Test Group Space`,
      participants: [marty, docbrown, lorraine]
    }).then((c) => {
      conversation = c;
      return conversation;
    }));

    before(`create one on one converstation`, () => lorraine.spark.internal.conversation.create({
      participants: [marty, lorraine]
    }).then((c) => {
      oneOnOneConversation = c;
      return oneOnOneConversation;
    }));

    before(`inject token`, () => {
      browserLocal.execute((localAccessToken) => {
        const csmmDom = document.createElement(`div`);
        csmmDom.setAttribute(`class`, `ciscospark-widget`);
        csmmDom.setAttribute(`data-toggle`, `ciscospark-recents`);
        csmmDom.setAttribute(`data-access-token`, localAccessToken);
        document.getElementById(`ciscospark-widget`).appendChild(csmmDom);
        window.loadBundle(`/dist-recents/bundle.js`);
      }, marty.token.access_token);
      browserLocal.waitForVisible(elements.recentsWidget);
    });

    it(`loads the test page`, () => {
      const title = browserLocal.getTitle();
      assert.equal(title, `Cisco Spark Widget Test`);
    });

    describe(`group space`, () => {
      it(`displays a new incoming message`, () => {
        const lorraineText = `Marty, will we ever see you again?`;
        displayIncomingMessage(browserLocal, lorraine, conversation, lorraineText);
      });

      it(`removes unread indicator when read`, () => {
        const lorraineText = `You're safe and sound now!`;
        displayAndReadIncomingMessage(browserLocal, lorraine, marty, conversation, lorraineText);
      });
    });

    describe(`one on one space`, () => {
      it(`displays a new incoming message`, () => {
        const lorraineText = `Marty? Why are you so nervous?`;
        displayIncomingMessage(browserLocal, lorraine, oneOnOneConversation, lorraineText, true);
      });

      it(`removes unread indicator when read`, () => {
        const lorraineText = `You're safe and sound now!`;
        displayAndReadIncomingMessage(browserLocal, lorraine, marty, oneOnOneConversation, lorraineText);
      });

      it(`displays a new one on one`, () => {
        const docText = `Marty! We have to talk!`;
        createSpaceAndPost(browserLocal, docbrown, [marty, docbrown], undefined, docText, true);
      });
    });

  });
});
