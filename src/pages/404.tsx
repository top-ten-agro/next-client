import NextLink from "next/link";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import type { NextPageWithLayout } from "./_app";
import { useTheme } from "@mui/material/styles";

const NotFound: NextPageWithLayout = () => {
  const theme = useTheme();
  return (
    <Container
      sx={{
        height: `calc(100vh - ${
          ((theme.mixins.toolbar.minHeight as number) ?? 0) + 10
        }px)`,
        display: "grid",
        placeItems: "center",
      }}
    >
      <Box sx={{ textAlign: "center", maxWidth: 600 }}>
        <Typography variant="h1" component="h1" gutterBottom>
          404
        </Typography>
        <Typography variant="h5" component="p" gutterBottom>
          The page you are looking for does not exist.
        </Typography>

        <Button
          variant="contained"
          color="primary"
          LinkComponent={NextLink}
          href="/"
          sx={{ mt: 4 }}
        >
          Go back to homepage
        </Button>
      </Box>
    </Container>
  );
};

export default NotFound;
