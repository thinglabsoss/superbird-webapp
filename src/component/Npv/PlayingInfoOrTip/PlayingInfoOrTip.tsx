import PlayingInfo from 'component/Npv/PlayingInfo/PlayingInfo';
import Tips from 'component/Npv/Tips/Tips';
import { useStore } from 'context/store';
import { observer } from 'mobx-react-lite';
import { CSSTransition, SwitchTransition } from 'react-transition-group';
import styles from './PlayingInfoOrTip.module.scss';
import { useRef } from 'react';

const playingInfoAnim = {
  enter: styles.playingInfoEnter,
  enterActive: styles.playingInfoEnterActive,
  exit: styles.playingInfoExit,
  exitActive: styles.playingInfoExitActive,
};

const tipAnim = {
  enter: styles.tipEnter,
  enterActive: styles.tipEnterActive,
  exit: styles.tipExit,
  exitActive: styles.tipExitActive,
};

const PlayingInfoOrTip = () => {
  const uiState = useStore().npvStore.tipsUiState;
  const nodeRef = useRef<HTMLDivElement>(null);

  return (
    <div className={styles.playingInfoOrTip}>
      <SwitchTransition>
        <CSSTransition
          key={uiState.tipToShow ? 1 : 0}
          timeout={300}
          classNames={uiState.tipToShow ? tipAnim : playingInfoAnim}
          nodeRef={nodeRef}
        >
          <div ref={nodeRef}>{uiState.tipToShow ? <Tips /> : <PlayingInfo />}</div>
        </CSSTransition>
      </SwitchTransition>
    </div>
  );
};

export default observer(PlayingInfoOrTip);
