import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { HOME_IDENTIFIER, VOICE_IDENTIFIER, YOUR_LIBRARY } from 'store/ShelfStore';
import {
  IconLibrary32,
  IconHome32,
  IconHomeActive32,
  IconSearch32,
  IconSearchActive,
  IconLibraryActive,
} from 'component/CarthingUIComponents';

import styles from './ShelfHeader.module.scss';
import ShelfHeaderItem, { TitleRef } from './ShelfHeaderItem';
import { observer } from 'mobx-react-lite';
import { useStore } from 'context/store';

export const CATEGORY_ICONS = {
  [HOME_IDENTIFIER]: {
    components: {
      active: <IconHomeActive32 />,
      inactive: <IconHome32 />,
    },
    iconMargin: 10,
  },
  [VOICE_IDENTIFIER]: {
    components: {
      active: <IconSearchActive iconSize={32} />,
      inactive: <IconSearch32 />,
    },
    iconMargin: 8,
  },
  [YOUR_LIBRARY]: {
    components: {
      active: <IconLibraryActive iconSize={32} />,
      inactive: <IconLibrary32 />,
    },
    iconMargin: 6,
  },
};

type HeaderGeometry = {
  translateLefts: number[];
  yourLibTranslateLeft: number;
  underlineTranslateX: number;
  underlineScaleX: number;
  hasUnderline: boolean;
};

const EMPTY_GEOMETRY: HeaderGeometry = {
  translateLefts: [],
  yourLibTranslateLeft: 0,
  underlineTranslateX: 0,
  underlineScaleX: 0,
  hasUnderline: false,
};

const ShelfHeader = () => {
  const uiState = useStore().shelfStore.shelfController.headerUiState;

  const mainCategories = uiState.mainCategories;
  const yourLibraryCategories = uiState.yourLibraryCategories;
  const numberOfMainCategories = uiState.mainCategoriesCount;
  const activeTitleIndex = uiState.activeTitleIndex;
  const isInYourLibrary = uiState.isInYourLibrary;
  const shouldShowShelfHeader = uiState.shouldShowShelfHeader;

  const titleRefs = useRef<(TitleRef | null)[]>([]);
  const [geometry, setGeometry] = useState<HeaderGeometry>(EMPTY_GEOMETRY);
  const [fontTick, setFontTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) {
        setFontTick(tick => tick + 1);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useLayoutEffect(() => {
    const refs = titleRefs.current;
    const textWidthBefore = (index: number) =>
      refs
        .slice(0, index)
        .reduce((sum, ref) => (ref?.titleTextRef ? sum + ref.titleTextRef.offsetWidth : sum), 0) +
      8 * index; // move everything an additional 8px left to reduce header margins when Your Library is expanded

    const translateLefts = Array.from({ length: numberOfMainCategories + 1 + yourLibraryCategories.length }, (_, index) =>
      textWidthBefore(index),
    );
    const yourLibTranslateLeft = textWidthBefore(numberOfMainCategories + 1);

    const container = refs[activeTitleIndex]?.titleContainerRef;
    if (container) {
      setGeometry({
        translateLefts,
        yourLibTranslateLeft,
        underlineScaleX: container.offsetWidth,
        underlineTranslateX: isInYourLibrary ? container.offsetLeft - yourLibTranslateLeft : container.offsetLeft,
        hasUnderline: true,
      });
    } else {
      setGeometry({
        translateLefts,
        yourLibTranslateLeft,
        underlineScaleX: 0,
        underlineTranslateX: 0,
        hasUnderline: false,
      });
    }
  }, [numberOfMainCategories, yourLibraryCategories.length, activeTitleIndex, isInYourLibrary, fontTick]);

  if (!shouldShowShelfHeader) {
    return null;
  }

  const titleTranslateLeft = (index: number) => geometry.translateLefts[index] ?? 0;

  return (
    <>
      <div className={styles.shelfTitles}>
        {mainCategories.map((category, index) => (
          <ShelfHeaderItem
            key={category.parsedId}
            id={category.parsedId}
            title={category.title}
            icon={CATEGORY_ICONS[category.parsedId].components}
            iconMargin={CATEGORY_ICONS[category.parsedId].iconMargin}
            marginRight={40}
            visible
            active={uiState.isSelectedItemCategory(category.parsedId)}
            onlyIcon={isInYourLibrary}
            translateLeft={titleTranslateLeft(index)}
            ref={(ref: TitleRef) => {
              titleRefs.current[index] = ref;
            }}
          />
        ))}
        <ShelfHeaderItem
          id={YOUR_LIBRARY}
          title="Your Library"
          icon={CATEGORY_ICONS[YOUR_LIBRARY].components}
          iconMargin={CATEGORY_ICONS[YOUR_LIBRARY].iconMargin}
          marginRight={40}
          visible
          active={isInYourLibrary}
          onlyIcon={isInYourLibrary}
          translateLeft={titleTranslateLeft(numberOfMainCategories)}
          ref={(ref: TitleRef) => {
            titleRefs.current[numberOfMainCategories] = ref;
          }}
        />
        {yourLibraryCategories.map((category, index) => (
          <ShelfHeaderItem
            key={category.parsedId}
            id={category.parsedId}
            title={category.title}
            marginRight={24}
            visible={isInYourLibrary}
            active={uiState.isSelectedItemCategory(category.parsedId)}
            translateLeft={geometry.yourLibTranslateLeft}
            ref={(ref: TitleRef) => {
              titleRefs.current[numberOfMainCategories + index + 1] = ref;
            }}
          />
        ))}
      </div>

      <div className={styles.titleUnderlineContainer}>
        {geometry.hasUnderline && (
          <div
            className={styles.titleUnderline}
            style={{
              transform: `translateX(${geometry.underlineTranslateX}px) scaleX(${geometry.underlineScaleX})`,
            }}
          />
        )}
      </div>
    </>
  );
};

export default observer(ShelfHeader);
