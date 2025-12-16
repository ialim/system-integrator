import { Icon, IconProps } from "@chakra-ui/react";

const createSvg = (viewBox: string, path: JSX.Element, defaults: Partial<IconProps> = {}) => {
  const Comp = (props: IconProps) => (
    <Icon viewBox={viewBox} fill="none" stroke="currentColor" {...defaults} {...props}>
      {path}
    </Icon>
  );
  return Comp;
};

export const SearchIcon = createSvg(
  "0 0 24 24",
  <path
    fillRule="evenodd"
    clipRule="evenodd"
    d="M10.5 3.75a6.75 6.75 0 0 1 5.364 10.786l3.35 3.35a.75.75 0 1 1-1.06 1.06l-3.35-3.35A6.75 6.75 0 1 1 10.5 3.75Zm0 1.5a5.25 5.25 0 1 0 0 10.5 5.25 5.25 0 0 0 0-10.5Z"
    fill="currentColor"
  />
);

export const BellIcon = createSvg(
  "0 0 24 24",
  <path
    d="M6 9.5a6 6 0 1 1 12 0v3.4l1.2 1.9c.35.54-.03 1.25-.68 1.25H5.48c-.65 0-1.03-.71-.68-1.25L6 12.9Z"
    strokeWidth="1.6"
  />
);

export const RefreshIcon = createSvg(
  "0 0 24 24",
  <path
    d="M4.5 10.5a7 7 0 0 1 11.6-5.2L18.5 8m1 5.5a7 7 0 0 1-11.6 5.2L5.5 16"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
);

export const RepeatIcon = RefreshIcon;

export const ChevronDownIcon = createSvg(
  "0 0 24 24",
  <path d="M6 9l6 6 6-6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
);

export const AddIcon = createSvg(
  "0 0 24 24",
  <path d="M12 5v14m7-7H5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
);

export const MinusIcon = createSvg(
  "0 0 24 24",
  <path d="M5 12h14" strokeWidth="1.8" strokeLinecap="round" />
);

export const DeleteIcon = createSvg(
  "0 0 24 24",
  <path
    d="M9.5 5h5M6 7h12m-1 0-.6 10.1a1 1 0 0 1-1 .9H8.6a1 1 0 0 1-1-.9L7 7m3 4v5m4-5v5"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
);

export const EditIcon = createSvg(
  "0 0 24 24",
  <path
    d="M6 15.75V18h2.25l7.1-7.1-2.25-2.25L6 15.75Zm9.32-9.32c.3-.3.77-.3 1.06 0l1.19 1.19c.3.3.3.77 0 1.06l-1.21 1.21-2.25-2.25 1.21-1.21Z"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
);

export const CalendarIcon = createSvg(
  "0 0 24 24",
  <path
    d="M7 4.5v3m10-3v3M5.5 8.5h13m-12 3h3m2.5 0h3m-8.5 3h3m2.5 0h3M6.5 6h11A1.5 1.5 0 0 1 19 7.5v10A1.5 1.5 0 0 1 17.5 19h-11A1.5 1.5 0 0 1 5 17.5v-10A1.5 1.5 0 0 1 6.5 6Z"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
);

export const CheckCircleIcon = createSvg(
  "0 0 24 24",
  <path
    d="M9.5 12.5 11 14l3.5-4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
);

export const DragHandleIcon = createSvg(
  "0 0 24 24",
  <path d="M9 6h6M9 12h6M9 18h6" strokeWidth="1.6" strokeLinecap="round" />
);

export const ExternalLinkIcon = createSvg(
  "0 0 24 24",
  <path
    d="M14 5h5v5m0-5-6.5 6.5M12 7H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-5"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
);

export const SettingsIcon = createSvg(
  "0 0 24 24",
  <path
    d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.5-3a7.5 7.5 0 0 0-.09-1.15l1.59-1.24a.75.75 0 0 0 .18-.94l-1.5-2.6a.75.75 0 0 0-.91-.32l-1.88.76a7.52 7.52 0 0 0-1.98-1.15l-.3-2.01A.75.75 0 0 0 12 2.5h-3a.75.75 0 0 0-.74.64l-.3 2.02a7.52 7.52 0 0 0-1.98 1.15l-1.88-.76a.75.75 0 0 0-.91.32l-1.5 2.6a.75.75 0 0 0 .18.94l1.59 1.24A7.54 7.54 0 0 0 4.5 12c0 .39.03.77.09 1.15l-1.59 1.24a.75.75 0 0 0-.18.94l1.5 2.6a.75.75 0 0 0 .91.32l1.88-.76c.6.47 1.27.86 1.98 1.15l.3 2.02c.05.36.36.64.74.64h3c.37 0 .69-.28.74-.64l.3-2.02a7.52 7.52 0 0 0 1.98-1.15l1.88.76a.75.75 0 0 0 .91-.32l1.5-2.6a.75.75 0 0 0-.18-.94l-1.59-1.24c.06-.38.09-.76.09-1.15Z"
    strokeWidth="1.1"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
);

export const StarIcon = createSvg(
  "0 0 24 24",
  <path
    d="m12 4 2.1 4.62 5.06.4-3.85 3.35 1.12 4.91L12 14.8l-4.43 2.48 1.12-4.91L4.84 9.02l5.06-.4L12 4Z"
    strokeWidth="1.4"
    strokeLinejoin="round"
  />
);
