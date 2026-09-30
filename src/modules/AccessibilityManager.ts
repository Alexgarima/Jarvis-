import { AccessibilityStep, StructuredAction } from '../types/jarvis';

class AccessibilityManager {
  private serviceEnabled: boolean = true;
  private currentActiveSteps: AccessibilityStep[] = [];
  private onStepUpdateCallback: ((steps: AccessibilityStep[]) => void) | null = null;

  public isEnabled(): boolean {
    return this.serviceEnabled;
  }

  public setEnabled(val: boolean) {
    this.serviceEnabled = val;
  }

  public onStepUpdate(cb: (steps: AccessibilityStep[]) => void) {
    this.onStepUpdateCallback = cb;
    return () => {
      this.onStepUpdateCallback = null;
    };
  }

  public generateStepSequence(action: StructuredAction): AccessibilityStep[] {
    const appName = action.app.toLowerCase();
    const query = action.text || '';

    switch (appName) {
      case 'instagram':
        return [
          {
            step: 1,
            label: 'Launch Target Package',
            targetScreen: 'Launcher',
            targetElement: 'com.instagram.android.MainActivity',
            actionType: 'intent',
            status: 'pending',
            detail: 'Dispatched Android Intent with CATEGORY_LAUNCHER',
          },
          {
            step: 2,
            label: 'Locate Search Navigation Tab',
            targetScreen: 'FeedScreen',
            targetElement: 'id/tab_search_icon',
            actionType: 'click',
            status: 'pending',
            detail: 'AccessibilityNodeInfo click event injected on Explore Tab',
          },
          {
            step: 3,
            label: 'Focus Search Query Field',
            targetScreen: 'ExploreScreen',
            targetElement: 'id/action_bar_search_edit_text',
            actionType: 'locate',
            status: 'pending',
            detail: 'Requested input focus and virtual keyboard trigger',
          },
          {
            step: 4,
            label: `Inject Query: "${query}"`,
            targetScreen: 'SearchScreen',
            targetElement: 'id/action_bar_search_edit_text',
            actionType: 'type',
            status: 'pending',
            detail: `ACTION_SET_TEXT with payload: "${query}"`,
          },
          {
            step: 5,
            label: 'Select Target Profile',
            targetScreen: 'SearchResults',
            targetElement: 'id/row_search_user_primary_subtitle',
            actionType: 'click',
            status: 'pending',
            detail: 'Navigated to verified user profile header',
          },
        ];

      case 'youtube':
        return [
          {
            step: 1,
            label: 'Launch YouTube Subsystem',
            targetScreen: 'Launcher',
            targetElement: 'com.google.android.youtube',
            actionType: 'intent',
            status: 'pending',
            detail: 'Invoking Google YouTube Activity via Direct Intent',
          },
          {
            step: 2,
            label: 'Locate Search Button in Top Bar',
            targetScreen: 'HomeFeed',
            targetElement: 'id/menu_item_search',
            actionType: 'click',
            status: 'pending',
            detail: 'Clicking top-right search magnifying lens icon',
          },
          {
            step: 3,
            label: `Input Search Query: "${query}"`,
            targetScreen: 'SearchActivity',
            targetElement: 'id/search_query_box',
            actionType: 'type',
            status: 'pending',
            detail: `Simulating keyboard buffer for "${query}"`,
          },
          {
            step: 4,
            label: 'Execute Search Query',
            targetScreen: 'SearchActivity',
            targetElement: 'id/keyboard_action_search',
            actionType: 'click',
            status: 'pending',
            detail: 'Injected ACTION_CLICK on submit button',
          },
        ];

      case 'whatsapp':
        return [
          {
            step: 1,
            label: 'Open WhatsApp Messenger',
            targetScreen: 'Launcher',
            targetElement: 'com.whatsapp',
            actionType: 'intent',
            status: 'pending',
            detail: 'Resolved target contact intent stream',
          },
          {
            step: 2,
            label: `Locate Contact: ${action.recipient || 'Recipient'}`,
            targetScreen: 'ChatList',
            targetElement: `id/contact_name: "${action.recipient || 'Mohit'}"`,
            actionType: 'locate',
            status: 'pending',
            detail: 'Scanned accessibility node hierarchy for contact title',
          },
          {
            step: 3,
            label: 'Populate Message Text Field',
            targetScreen: 'Conversation',
            targetElement: 'id/entry_edit_text',
            actionType: 'type',
            status: 'pending',
            detail: `Pasted payload: "${query}"`,
          },
          {
            step: 4,
            label: 'Awaiting User Confirmation Before Send',
            targetScreen: 'Conversation',
            targetElement: 'id/send_btn',
            actionType: 'click',
            status: 'pending',
            detail: 'Protected action paused for voice or touch confirmation',
          },
        ];

      case 'chrome':
        return [
          {
            step: 1,
            label: 'Open Google Chrome Omnibox',
            targetScreen: 'ChromeTab',
            targetElement: 'id/url_bar',
            actionType: 'locate',
            status: 'pending',
            detail: 'Focused URL address bar',
          },
          {
            step: 2,
            label: `Type URL / Search Query: "${query}"`,
            targetScreen: 'ChromeTab',
            targetElement: 'id/url_bar',
            actionType: 'type',
            status: 'pending',
            detail: `Sending keystrokes for "${query}"`,
          },
          {
            step: 3,
            label: 'Submit Web Request',
            targetScreen: 'ChromeRenderer',
            targetElement: 'id/navigate_button',
            actionType: 'click',
            status: 'pending',
            detail: 'Dispatching HTTP navigation intent',
          },
        ];

      default:
        return [
          {
            step: 1,
            label: `Launch Application: ${action.app}`,
            targetScreen: 'Launcher',
            targetElement: `package:${action.app.toLowerCase()}`,
            actionType: 'intent',
            status: 'pending',
            detail: 'Dispatched standard intent',
          },
          {
            step: 2,
            label: 'Resolve Accessibility Tree',
            targetScreen: action.screen || 'Main',
            targetElement: action.element || 'root_view',
            actionType: 'locate',
            status: 'pending',
            detail: 'Hierarchy verified',
          },
        ];
    }
  }

  public async executeSimulatedFlow(
    action: StructuredAction,
    onProgress: (steps: AccessibilityStep[]) => void
  ): Promise<void> {
    const steps = this.generateStepSequence(action);
    this.currentActiveSteps = steps;
    onProgress([...this.currentActiveSteps]);

    for (let i = 0; i < steps.length; i++) {
      this.currentActiveSteps[i].status = 'running';
      onProgress([...this.currentActiveSteps]);
      await new Promise((r) => setTimeout(r, 450));

      this.currentActiveSteps[i].status = 'completed';
      onProgress([...this.currentActiveSteps]);
      await new Promise((r) => setTimeout(r, 150));
    }
  }
}

export const accessibilityManager = new AccessibilityManager();
