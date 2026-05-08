import LazyImage from 'component/LazyImage/LazyImage';
import { SwipeDirection } from 'component/Npv/SwipeHandler';
import { useStore } from 'context/store';
import { observer } from 'mobx-react-lite';
import { cloneElement, type ReactElement, useEffect, useRef } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { CSSTransitionClassNames, CSSTransitionProps } from 'react-transition-group/CSSTransition';
import { QueueItem } from 'store/QueueStore';
import { transitionDurationMs } from 'style/Variables';
import styles from './Artwork.module.scss';

type Props = {
  tracks: Array<QueueItem>;
  getAnimationClassNames: () => CSSTransitionClassNames;
};

const Artwork = ({ tracks, getAnimationClassNames }: Props) => {
  const uiState = useStore().npvStore.playingInfoUiState;

  const lastImageUri = useRef(uiState.currentItem.image_uri);
  const doAnimate =
    uiState.swipeHandler.swipeDirection !== SwipeDirection.NONE &&
    lastImageUri.current !== uiState.currentItem.image_uri;

  useEffect(() => {
    lastImageUri.current = uiState.currentItem.image_uri;
  }, [uiState.currentItem.image_uri]);

  useEffect(() => {
    uiState.loadPrevAndNextImage();
  }, [uiState, uiState.previousItem?.image_uri, uiState.nextItem?.image_uri]);

  return (
    <div className={styles.artwork}>
      <TransitionGroup
        className={styles.artworkTransitionGroup}
        enter={doAnimate}
        childFactory={child => {
          return cloneElement(child as ReactElement<CSSTransitionProps>, {
            timeout: transitionDurationMs,
            exit: doAnimate,
            classNames: getAnimationClassNames(),
          });
        }}
      >
        {tracks.map(track => (
          <ArtworkTransition
            key={track.uid}
            track={track}
            onEntering={() => uiState.swipeHandler.setSwipeDirection(SwipeDirection.NONE)}
            onClick={uiState.handleArtworkClick}
          />
        ))}
      </TransitionGroup>
    </div>
  );
};

type ArtworkTransitionProps = Partial<CSSTransitionProps> & {
  track: QueueItem;
  onEntering: () => void;
  onClick: () => void;
};

// Each track gets its own keyed transition + ref so the TransitionGroup-
// keyed children can pass nodeRef to react-transition-group without
// findDOMNode. TransitionGroup injects `in` and other lifecycle props via
// React.cloneElement on each immediate child; the parent's childFactory
// re-clones to add timeout/exit/classNames. Both flow into this wrapper
// as props that we forward to the inner CSSTransition - dropping any of
// them would leave the transition stuck (no in → never enters → div
// stays unmounted/hidden, image never paints).
const ArtworkTransition = ({ track, onEntering, onClick, ...transitionProps }: ArtworkTransitionProps) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  return (
    <CSSTransition
      timeout={transitionDurationMs}
      onEntering={onEntering}
      {...transitionProps}
      nodeRef={nodeRef}
    >
      <div ref={nodeRef} className={styles.transitionContainer}>
        <LazyImage uri={track.uri} size={248} imageId={track.image_uri} onClick={onClick} dataTestId="npv-artwork" />
      </div>
    </CSSTransition>
  );
};

export default observer(Artwork);
