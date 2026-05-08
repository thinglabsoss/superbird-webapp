import { observer } from 'mobx-react-lite';
import styles from 'component/PhoneCall/PhoneCallTimer.module.scss';
import { useStore } from 'context/store';
import { CSSTransition } from 'react-transition-group';
import CountUpTimer from 'component/CountUpTimer/CountUpTimer';
import Type from 'component/CarthingUIComponents/Type/Type';
import { transitionDurationMs } from 'style/Variables';
import { useRef } from 'react';

const transitionStyles = {
  enter: styles.enter,
  enterActive: styles.enterActive,
  exit: styles.exit,
  exitActive: styles.exitActive,
};

const PhoneCallTimer = () => {
  const uiState = useStore().phoneCallController.phoneCallUiState;
  const nodeRef = useRef<HTMLDivElement>(null);

  return (
    <CSSTransition
      classNames={transitionStyles}
      timeout={transitionDurationMs}
      in={uiState.isOngoingCall}
      unmountOnExit
      nodeRef={nodeRef}
    >
      <Type name="celloBook" dataTestId="phone-timer" className={styles.timer} ref={nodeRef}>
        <div className={styles.timerDiv}>
          <CountUpTimer />
        </div>
      </Type>
    </CSSTransition>
  );
};

export default observer(PhoneCallTimer);
