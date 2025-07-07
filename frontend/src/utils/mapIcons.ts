import L from 'leaflet';
import { COLORS, SIZES } from '../constants';

export class MapIcons {
  static createCustomIcon(type: string) {
    const iconColors = COLORS.RESTROOM_TYPES;
    const isMulti = type === 'multi';

    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${iconColors[type as keyof typeof iconColors] || iconColors.neutral};
          width: ${isMulti ? SIZES.ICON.LARGE : SIZES.ICON.MEDIUM}px;
          height: ${isMulti ? SIZES.ICON.LARGE : SIZES.ICON.MEDIUM}px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          color: white;
        ">
          ${isMulti ? '🏢' : ''}
        </div>
      `,
      iconSize: [isMulti ? SIZES.ICON.LARGE : SIZES.ICON.MEDIUM, isMulti ? SIZES.ICON.LARGE : SIZES.ICON.MEDIUM],
      iconAnchor: [isMulti ? SIZES.ICON.LARGE/2 : SIZES.ICON.MEDIUM/2, isMulti ? SIZES.ICON.LARGE/2 : SIZES.ICON.MEDIUM/2]
    });
  }

  static createUserIcon() {
    return L.divIcon({
      className: 'user-marker',
      html: `
        <div style="
          background-color: ${COLORS.USER_LOCATION};
          width: ${SIZES.USER_MARKER}px;
          height: ${SIZES.USER_MARKER}px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        "></div>
      `,
      iconSize: [SIZES.USER_MARKER, SIZES.USER_MARKER],
      iconAnchor: [SIZES.USER_MARKER/2, SIZES.USER_MARKER/2]
    });
  }

  static createSearchResultIcon() {
    return L.divIcon({
      className: 'search-result-marker',
      html: `
        <div style="
          background-color: ${COLORS.SEARCH_RESULT};
          width: ${SIZES.ICON.SMALL}px;
          height: ${SIZES.ICON.SMALL}px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>
      `,
      iconSize: [SIZES.ICON.SMALL, SIZES.ICON.SMALL],
      iconAnchor: [SIZES.ICON.SMALL/2, SIZES.ICON.SMALL/2]
    });
  }

  static createSelectedSearchIcon() {
    return L.divIcon({
      className: 'selected-search-marker',
      html: `
        <div style="
          background-color: ${COLORS.SELECTED_SEARCH};
          width: ${SIZES.ICON.MEDIUM}px;
          height: ${SIZES.ICON.MEDIUM}px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        "></div>
      `,
      iconSize: [SIZES.ICON.MEDIUM, SIZES.ICON.MEDIUM],
      iconAnchor: [SIZES.ICON.MEDIUM/2, SIZES.ICON.MEDIUM/2]
    });
  }
}