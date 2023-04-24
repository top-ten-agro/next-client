import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";

type BreadcrumbItem = { name: string; path?: string };

const MuiBreadcrumbs = ({ items }: { items: BreadcrumbItem[] }) => {
  return (
    <Breadcrumbs aria-label="breadcrumb">
      <Link underline="hover" color="inherit" component={NextLink} href="/">
        Home
      </Link>
      {items.map((item) =>
        item.path ? (
          <Link
            underline="hover"
            color="inherit"
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

export default MuiBreadcrumbs;
