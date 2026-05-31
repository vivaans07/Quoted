import React from 'react';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

export type IconName =
  | 'home' | 'doc' | 'users' | 'gear' | 'bell' | 'plus' | 'chevR' | 'chevD'
  | 'mic' | 'check' | 'sms' | 'mail' | 'arrowR' | 'edit' | 'x' | 'refresh'
  | 'clock' | 'bolt' | 'camera' | 'link' | 'phone' | 'image' | 'trash';

interface Props {
  name: IconName;
  size?: number;
  stroke?: string;
  sw?: number;
}

export function Icon({ name, size = 24, stroke = 'currentColor', sw = 2 }: Props) {
  const p = {
    fill: 'none' as const,
    stroke,
    strokeWidth: sw,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {render(name, p)}
    </Svg>
  );
}

function render(name: IconName, p: any) {
  switch (name) {
    case 'home':
      return (<>
        <Path {...p} d="M3 11.5 12 4l9 7.5" />
        <Path {...p} d="M5 10v9h5v-5h4v5h5v-9" />
      </>);
    case 'doc':
      return (<>
        <Rect {...p} x={5} y={3} width={14} height={18} rx={2} />
        <Path {...p} d="M9 8h6M9 12h6M9 16h4" />
      </>);
    case 'users':
      return (<>
        <Circle {...p} cx={9} cy={8} r={3.2} />
        <Path {...p} d="M3.5 19c.6-3 2.9-4.5 5.5-4.5S13.9 16 14.5 19" />
        <Path {...p} d="M16 5.5a3 3 0 010 5.6M17.5 19c-.3-2-1.2-3.3-2.5-4" />
      </>);
    case 'gear':
      return (<>
        <Circle {...p} cx={12} cy={12} r={3.2} />
        <Path {...p} d="M12 3v2.2M12 18.8V21M4.2 7l1.9 1.1M17.9 15.9l1.9 1.1M4.2 17l1.9-1.1M17.9 8.1 19.8 7M3 12h2.2M18.8 12H21" />
      </>);
    case 'bell':
      return (<>
        <Path {...p} d="M6 9a6 6 0 0112 0c0 5 2 6 2 6H4s2-1 2-6Z" />
        <Path {...p} d="M10 20a2 2 0 004 0" />
      </>);
    case 'plus':
      return <Path {...p} d="M12 5v14M5 12h14" />;
    case 'chevR':
      return <Path {...p} d="M9 5l7 7-7 7" />;
    case 'chevD':
      return <Path {...p} d="M5 9l7 7 7-7" />;
    case 'mic':
      return (<>
        <Rect {...p} x={9} y={3} width={6} height={11} rx={3} />
        <Path {...p} d="M5 11a7 7 0 0014 0M12 18v3M9 21h6" />
      </>);
    case 'check':
      return <Path {...p} d="M4 12.5l5 5L20 6.5" />;
    case 'sms':
      return (<>
        <Path {...p} d="M4 5h16v11H9l-4 3v-3H4z" />
        <Path {...p} d="M8 10h.01M12 10h.01M16 10h.01" />
      </>);
    case 'mail':
      return (<>
        <Rect {...p} x={3} y={5} width={18} height={14} rx={2} />
        <Path {...p} d="M4 7l8 6 8-6" />
      </>);
    case 'arrowR':
      return <Path {...p} d="M5 12h14M13 6l6 6-6 6" />;
    case 'edit':
      return (<>
        <Path {...p} d="M4 20h4L19 9l-4-4L4 16z" />
        <Path {...p} d="M14 6l4 4" />
      </>);
    case 'x':
      return <Path {...p} d="M6 6l12 12M18 6L6 18" />;
    case 'refresh':
      return (<>
        <Path {...p} d="M20 11a8 8 0 10-2.3 6" />
        <Path {...p} d="M20 4v5h-5" />
      </>);
    case 'clock':
      return (<>
        <Circle {...p} cx={12} cy={12} r={8.5} />
        <Path {...p} d="M12 7.5V12l3 2" />
      </>);
    case 'bolt':
      return <Path {...p} d="M13 3 5 13h6l-1 8 8-10h-6z" />;
    case 'camera':
      return (<>
        <Path {...p} d="M4 8h3l1.5-2h7L17 8h3v11H4z" />
        <Circle {...p} cx={12} cy={13} r={3.2} />
      </>);
    case 'link':
      return (<>
        <Path {...p} d="M9 13a5 5 0 007 0l2-2a5 5 0 00-7-7l-1 1" />
        <Path {...p} d="M15 11a5 5 0 00-7 0l-2 2a5 5 0 007 7l1-1" />
      </>);
    case 'phone':
      return <Path {...p} d="M5 4h4l2 5-3 2a12 12 0 005 5l2-3 5 2v4a1 1 0 01-1 1A16 16 0 014 5a1 1 0 011-1Z" />;
    case 'image':
      return (<>
        <Rect {...p} x={3} y={4} width={18} height={16} rx={2} />
        <Circle {...p} cx={8.5} cy={9.5} r={1.5} />
        <Path {...p} d="M21 16l-5-5L5 20" />
      </>);
    case 'trash':
      return (<>
        <Path {...p} d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
      </>);
    default:
      return null;
  }
}
