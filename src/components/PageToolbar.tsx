import MuiToolbar, { type ToolbarProps } from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import NextLink from "next/link";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import useMediaQuery from "@mui/material/useMediaQuery";
import { styled } from "@mui/material/styles";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";

type BreadcrumbItem = { name: string; path?: string };

interface Props {
  breadcrumbItems?: BreadcrumbItem[];
  backHref?: string;
  heading: string;
  action?: {
    text: React.ReactNode;
    href: string;
  };
}

const Toolbar = styled(MuiToolbar)<ToolbarProps>(() => ({
  paddingLeft: "0 !important",
  paddingRight: "0 !important",
}));

const PageToolbar = ({ action, heading, backHref, breadcrumbItems }: Props) => {
  return (
    <>
      {breadcrumbItems ? <MuiBreadcrumbs items={breadcrumbItems} /> : null}
      <Toolbar>
        {backHref ? (
          <IconButton
            aria-label="go to prevoius page"
            LinkComponent={NextLink}
            href={backHref}
            sx={{ mr: 1 }}
            color="primary"
          >
            <ArrowBackIcon />
          </IconButton>
        ) : null}
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          {heading}
        </Typography>
        {action ? (
          <Button LinkComponent={NextLink} href={action.href}>
            {action.text}
          </Button>
        ) : null}
      </Toolbar>
    </>
  );
};

export default PageToolbar;

const MuiBreadcrumbs = ({ items }: { items: BreadcrumbItem[] }) => {
  const isMobile = useMediaQuery("(max-width:600px)");
  return (
    <Breadcrumbs maxItems={isMobile ? 3 : undefined} aria-label="breadcrumb">
      <Link underline="hover" component={NextLink} href="/">
        Home
      </Link>
      {items.map((item) =>
        item.path ? (
          <Link
            underline="hover"
            href={item.path}
            component={NextLink}
            key={item.name}
          >
            {item.name}
          </Link>
        ) : (
          <Typography color="text.primary" key={item.name}>
            {item.name}
          </Typography>
        )
      )}
    </Breadcrumbs>
  );
};
