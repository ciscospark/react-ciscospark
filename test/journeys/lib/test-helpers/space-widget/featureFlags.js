import {assert} from 'chai';

import {elements as mainElements} from './main';
import {elements as rosterElements} from './roster';
import {elements as meetElements} from './meet';

/**
 *
 * Feature Flag Tests Journeys
 *
 * @export
 * @param {any} browserWithAllTheFeatures
 * @param {any} browserWithNoFeatures
 */
export default function featureFlagTests(browserWithAllTheFeatures, browserWithNoFeatures) {
  describe('Roster Feature Flag', () => {
    it('has a roster for user with feature flag', () => {
      browserWithAllTheFeatures.click(mainElements.menuButton);
      browserWithAllTheFeatures.waitForVisible(mainElements.activityMenu);
      assert.isTrue(
        browserWithAllTheFeatures
          .isVisible(`${mainElements.activityMenu} ${rosterElements.peopleButton}`)
      );
      browserWithAllTheFeatures.click(mainElements.exitButton);
    });

    it('does not have a roster for user without flag', () => {
      browserWithNoFeatures.click(mainElements.menuButton);
      browserWithNoFeatures.waitForVisible(mainElements.activityMenu);
      assert.isFalse(
        browserWithNoFeatures
          .isVisible(`${mainElements.activityMenu} ${rosterElements.peopleButton}`)
      );
      browserWithNoFeatures.click(mainElements.exitButton);
    });
  });

  describe('Group Calling Feature Flag', () => {
    it('has a call option for user with feature flag', () => {
      browserWithAllTheFeatures.click(mainElements.menuButton);
      browserWithAllTheFeatures.waitForVisible(mainElements.activityMenu);
      assert.isTrue(
        browserWithAllTheFeatures
          .isVisible(`${mainElements.activityMenu} ${meetElements.callButton}`)
      );
      browserWithAllTheFeatures.click(mainElements.exitButton);
    });

    it('does not have a call option for user without flag', () => {
      browserWithNoFeatures.click(mainElements.menuButton);
      browserWithNoFeatures.waitForVisible(mainElements.activityMenu);
      assert.isFalse(
        browserWithNoFeatures
          .isVisible(`${mainElements.activityMenu} ${meetElements.callButton}`)
      );
      browserWithNoFeatures.click(mainElements.exitButton);
    });
  });
}
