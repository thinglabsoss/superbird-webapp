import { CSSProperties, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import {
  AboutMenuItemId,
  AnimationType,
  MainMenuItemId,
  OptionsMenuItemId,
  RestartMenuItemId,
  View,
} from 'store/SettingsStore';
import { Transition, type TransitionProps, TransitionGroup } from 'react-transition-group';
import styles from './Settings.module.scss';
import { ENTERED, ENTERING, EXITED, EXITING } from 'react-transition-group/Transition';
import Submenu from './Submenu/Submenu';
import { transitionDurationMs } from 'style/Variables';
import classNames from 'classnames';
import Overlay, { FROM } from 'component/Overlays/Overlay';
import UnavailableSettingBanner from './UnavailableSettingBanner/UnavailableSettingBanner';
import { useStore } from 'context/store';
import { action, runInAction } from 'mobx';
import MainMenu from './MainMenu/MainMenu';
import AirVentInterference from './AirVentInterference/AirVentInterference';
import Licenses from './Licenses/Licenses';
import DevOptions from '../DevOptions/DevOptions';
import PhoneCalls from './PhoneCalls/PhoneCalls';
import PhoneConnection from './PhoneConnection/PhoneConnection';
import PowerTutorial from './PowerTutorial/PowerTutorial';
import FactoryReset from './FactoryReset/FactoryReset';
import RestartConfirm from './RestartConfirm/RestartConfirm';
import TipsOnDemand from './TipsOnDemand/TipsOnDemand';
import DisplayAndBrightness from './DisplayAndBrightness/DisplayAndBrightness';

type Styles = {
  [ENTERING]: CSSProperties;
  [ENTERED]: CSSProperties;
  [EXITING]: CSSProperties;
  [EXITED]: CSSProperties;
};

const STYLES_BOTTOM_UP: Styles = {
  [ENTERING]: {
    transform: 'translateY(0px)',
  },
  [ENTERED]: {
    transform: 'translateY(0px)',
  },
  [EXITING]: {
    transform: 'translateY(480px)',
  },
  [EXITED]: {
    transform: 'translateY(480px)',
  },
};

const STYLES_FADE_IN: Styles = {
  [ENTERING]: {
    opacity: 1,
  },
  [ENTERED]: {
    opacity: 1,
  },
  [EXITING]: {
    opacity: 0,
  },
  [EXITED]: {
    opacity: 0,
  },
};

const viewToComp = {
  [MainMenuItemId.SETTINGS_ROOT]: <MainMenu />,
  [OptionsMenuItemId.AIR_VENT_INTERFERENCE]: <AirVentInterference />,
  [OptionsMenuItemId.DISPLAY_AND_BRIGHTNESS]: <DisplayAndBrightness />,
  [MainMenuItemId.TIPS]: <TipsOnDemand />,
  [RestartMenuItemId.RESTART_CONFIRM]: <RestartConfirm />,
  [RestartMenuItemId.FACTORY_RESET]: <FactoryReset />,
  [RestartMenuItemId.POWER_OFF_TUTORIAL]: <PowerTutorial />,
  [MainMenuItemId.PHONE_CONNECTION]: <PhoneConnection />,
  [OptionsMenuItemId.PHONE_CALLS]: <PhoneCalls />,
  [AboutMenuItemId.LICENSE]: <Licenses />,
  [MainMenuItemId.DEVELOPER_OPTIONS]: <DevOptions />,
};
const Settings = () => {
  const {
    versionStatusStore,
    settingsStore: { viewStack, unavailableSettingsBannerUiState },
    overlayController,
    sessionStateStore,
  } = useStore();

  useEffect(() => {
    versionStatusStore.superbirdRequestVersion();
  }, [versionStatusStore]);

  const reflow = (node: HTMLElement) => {
    // eslint-disable-next-line no-unused-expressions
    node?.scrollTop;
  };

  const getComponent = (view: View) => {
    if (view.id && viewToComp[view.id]) {
      return viewToComp[view.id];
    }
    if (view.rows) {
      return <Submenu view={view} />;
    }
    return undefined;
  };

  useEffect(() => {
    runInAction(() => {
      if (sessionStateStore.isOffline && overlayController.overlayUiState.currentOverlay === 'settings') {
        unavailableSettingsBannerUiState.showUnavailableBanner();
      }
    });
  }, [sessionStateStore.isOffline, unavailableSettingsBannerUiState, overlayController.overlayUiState.currentOverlay]);

  return (
    <Overlay appear={FROM.BOTTOM} show={overlayController.isShowing('settings')}>
      <TransitionGroup>
        {viewStack.map((view, index) => {
          const isCurrentView = viewStack.length - 1 === index;
          const nextIsFade =
            index !== viewStack.length - 1 && viewStack[index + 1]?.animationType === AnimationType.FADE_IN;

          return (
            <SettingsLayer
              key={view.id}
              view={view}
              isCurrentView={isCurrentView}
              nextIsFade={nextIsFade}
              reflow={reflow}
              getComponent={getComponent}
            />
          );
        })}
      </TransitionGroup>
      <UnavailableSettingBanner />
    </Overlay>
  );
};

type SettingsLayerProps = Partial<TransitionProps> & {
  view: View;
  isCurrentView: boolean;
  nextIsFade: boolean;
  reflow: (node: HTMLElement) => void;
  getComponent: (view: View) => React.ReactNode;
};

// Each layer owns its own nodeRef so the TransitionGroup-keyed children can
// hand a stable per-instance ref to react-transition-group's findDOMNode-
// less path. The ...transitionProps spread catches `in` + lifecycle props
// TransitionGroup injects on each immediate child; without forwarding them
// the outer Transition never enters and the layer stays unmounted.
const SettingsLayer = observer(({ view, isCurrentView, nextIsFade, reflow, getComponent, ...transitionProps }: SettingsLayerProps) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  return (
    <Transition
      timeout={transitionDurationMs}
      onEnter={() => {
        if (nodeRef.current) reflow(nodeRef.current);
      }}
      {...transitionProps}
      nodeRef={nodeRef}
    >
      {action(transitionState => (
        <Transition in={isCurrentView} timeout={transitionDurationMs} unmountOnExit={!nextIsFade} nodeRef={nodeRef}>
          <div
            ref={nodeRef}
            style={
              view.animationType === AnimationType.FADE_IN
                ? STYLES_FADE_IN[transitionState]
                : STYLES_BOTTOM_UP[transitionState]
            }
            className={classNames(styles.settingsLayer, {
              [styles.transparent]: view.animationType === AnimationType.FADE_IN,
            })}
            data-testid="settings"
          >
            {getComponent(view)}
          </div>
        </Transition>
      ))}
    </Transition>
  );
});

export default observer(Settings);
