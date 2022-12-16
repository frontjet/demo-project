import type { GetStaticProps } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import dayjs from 'dayjs';
import { Stack, CircularProgress, Grid, Typography, Box, Button, Container } from '@mui/material';

import { IEvent } from 'types/events';
import { getEvent } from 'Api/events';
import { createImageUrl, getByLocale, getParamsFromQuery, pxToRem, removeStyles } from 'utils';
import { PageWithContainer } from 'types/nextPage';
import { AppLocales } from 'constants/locales';
import NavLink from 'components/NavLink';
import Head from 'components/Head';

interface IProps {
  event: IEvent;
  locale: AppLocales;
}

const Event: PageWithContainer<IProps> = ({ event, locale }) => {
  const { isFallback, asPath } = useRouter();

  if (isFallback || !event) {
    return (
      <Stack alignItems={'center'}>
        <CircularProgress />
      </Stack>
    );
  }

  const past = new Date() > new Date(event.date_end);

  return (
    <Grid container columnSpacing={7}>
      <Head title={getByLocale(event, 'title', locale)} ogImage={createImageUrl(event.image_url)} />
      <Grid item xs={12} md={5} order={{ xs: 2, md: 1 }}>
        <Stack spacing={4} paddingX={{ xs: 2, sm: 0 }}>
          <Typography variant="h1" mt={{ xs: 2, md: 0 }}>
            {getByLocale(event, 'title', locale)}
          </Typography>
          <Box>
            <Typography variant="body1" color="secondary" mb={1}>
              Date & Time
            </Typography>
            <Typography variant="body1">
              {dayjs(event.date_start).format('ddd, MMM DD, HH:mm')} - {dayjs(event.date_end).format('HH:mm')}
            </Typography>
          </Box>
          <Box>
            <Stack flexDirection={'row'} paddingBottom={0}>
              <Typography variant="body1" color="secondary">
                Description
              </Typography>
              <Stack
                flexDirection={'row'}
                paddingBottom={0}
                height={'max-content'}
                pl={4}
                pt={'0.3rem'}
                sx={{ '& .active-link': { borderBottom: '1px solid', borderColor: 'primary.main' } }}
              >
                <NavLink
                  href={asPath}
                  locale={AppLocales.EN}
                  active={locale === AppLocales.EN}
                  fontSize={pxToRem(14)}
                  pb={2}
                  mr={2}
                >
                  ENG
                </NavLink>

                <NavLink
                  href={asPath}
                  locale={AppLocales.AM}
                  active={locale === AppLocales.AM}
                  fontSize={pxToRem(14)}
                  pb={2}
                >
                  ARM
                </NavLink>
              </Stack>
            </Stack>

            <Box
              sx={{
                '& span': {
                  wordBreak: 'break-word',
                },
              }}
              dangerouslySetInnerHTML={{ __html: removeStyles(getByLocale(event, 'description', locale)) }}
            />
          </Box>
          {!past && (
            <Box display={{ xs: 'block', md: 'none' }}>
              <GetTicket event={event} />
            </Box>
          )}
        </Stack>
      </Grid>
      <Grid item xs={12} md={7} order={1}>
        <Box position={'relative'} sx={{ aspectRatio: '1.8' }}>
          <Image alt={getByLocale(event, 'title', locale)} src={createImageUrl(event.image_url)} fill priority />
        </Box>
        {!past && (
          <Box display={{ xs: 'none', md: 'block' }} mt={6}>
            <GetTicket event={event} />
          </Box>
        )}
      </Grid>
    </Grid>
  );
};

export default Event;

const GetTicket: React.FC<{ event: IEvent }> = ({ event }) => {
  const actualBaskets = event.baskets.filter((b) => new Date(b.date_to) > new Date());

  return (
    <>
      <Stack spacing="4px">
        {actualBaskets.map((basket, index) => (
          <Stack
            key={basket.id}
            direction="row"
            sx={{ backgroundColor: index === 0 ? 'rgba(38, 37, 36, 0.5)' : '#262524' }}
            justifyContent="space-between"
            padding="8px 73px 8px 20px"
          >
            <Typography>Before {dayjs(basket.date_to).format('MMM DD HH:mm')}</Typography>
            <Typography>{basket.price} AMD</Typography>
          </Stack>
        ))}
        <Stack
          direction="row"
          sx={{ backgroundColor: actualBaskets.length ? '#262524' : 'rgba(38, 37, 36, 0.5)' }}
          justifyContent="space-between"
          padding="8px 73px 8px 20px"
        >
          <Typography>Door</Typography>
          <Typography>{event.on_door_price} AMD</Typography>
        </Stack>
      </Stack>
      <Stack direction="row" justifyContent="flex-end" mt={3}>
        <Button
          variant="contained"
          href={`/events/${event.id}/pay`}
          LinkComponent={Link}
          sx={{
            width: [1, 'auto'],
            height: pxToRem(50),
            bgcolor: 'secondary.main',
            borderColor: 'secondary.main',
            paddingX: 7,

            ':hover': {
              bgcolor: 'background.default',
              borderColor: 'primary.main',
              color: 'text.primary',
            },
          }}
        >
          Get Ticket
        </Button>
      </Stack>
    </>
  );
};

Event.getContainer = (page: any) => (
  <Container
    maxWidth="lg"
    sx={{
      flex: 'auto',
      padding: 0,
      paddingBottom: 2,
      paddingTop: 4,
    }}
  >
    {page}
  </Container>
);

export const getStaticProps: GetStaticProps = async (context) => {
  const redirect = {
    props: {},
    redirect: {
      destination: '/',
    },
  };

  const { id } = getParamsFromQuery<{ id?: string }>(context.params ?? {}, ['id']);

  if (!id) {
    return redirect;
  }

  try {
    const event = await (await getEvent(Number(id))).data;

    // const event = await new Promise((res) => setTimeout(() => res({ title_en: 'test' }), 4000));

    return {
      props: {
        event,
        locale: context.locale,
      },
      revalidate: 60,
    };
  } catch (error) {
    return redirect;
  }
};

export async function getStaticPaths() {
  const events: IEvent[] = [];
  //   const events: IEvent[] = await (await getEvents(0)).data.data;

  const paths = events.map((event) => ({
    params: { id: String(event.id) },
  }));

  return { paths, fallback: true };
}