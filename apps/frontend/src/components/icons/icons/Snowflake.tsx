import { createIcon } from '../Icon';

export const Snowflake = createIcon({
  displayName: 'Snowflake',
  viewBox: '0 0 24 24',
  path: (
    <>
      <path d="M12 1v22" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M17.5 6.5l-11 11" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M6.5 6.5l11 11" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M12 7l-3-3m3 3l3-3m-3 10l-3 3m3-3l3 3" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M7 12l-3-3m3 3l-3 3m10-3l3-3m-3 3l3 3" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M9.5 9.5l-2-2m2 2l-2 2m5-2l2-2m-2 2l2 2" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </>
  ),
});