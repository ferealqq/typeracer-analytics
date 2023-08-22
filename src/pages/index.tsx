import Head from "next/head";
import { InformationCircleIcon } from "@heroicons/react/solid";
import {
  Card,
  Title,
  LineChart,
  Color,
  Flex,
  Icon,
  Text,
  TabGroup,
  TabList,
  Tab,
  AreaChart,
} from "@tremor/react";
import { api } from "~/utils/api";
import { useState } from "react";

type Item = {
  id: string;
  username: string;
  wpm: number;
  percentage: number;
  date: Date;
};

type KPI = "Words per minute" | "Percentage";

const WPM = "Words per minute";
const Percentage = "Percentage";

const Kpis = [WPM, Percentage];
const formatters = {
  [WPM]: (number: number) =>
    `${Intl.NumberFormat("us").format(number).toString()} wpm`,
  [Percentage]: (number: number) =>
    `${Intl.NumberFormat("us").format(number).toString()}%`,
};

const average = (list: number[]): number => {
  const sum = list.reduce((p, c) => p + c, 0);
  return sum / list.length;
};

const firstLetterUpperCase = (str: string) =>
  `${str[0]?.toUpperCase()}${str.slice(1)}`;

const dataTransformer = {
  byYear: (data: Item[]) => {
    const years = data.reduce(
      (
        group: Record<number, { wpm: number[]; percentage: number[] }>,
        item: Item
      ) => {
        const year = new Date(item.date).getFullYear();
        if (!group[year]) {
          group[year] = {
            wpm: [],
            percentage: [],
          };
        }
        group[year]?.wpm?.push(item.wpm);
        group[year]?.percentage?.push(item.percentage);
        return group;
      },
      {}
    );
    return Object.keys(years).map((year) => ({
      year: parseInt(year),
      [WPM]: average(years[parseInt(year)]?.wpm ?? []),
      [Percentage]: average(years[parseInt(year)]?.percentage ?? []),
    }));
  },
  byMonth: (data: Item[]) => {
    const list = data.reduce(
      (
        group: Record<string, { wpm: number[]; percentage: number[] }>,
        item: Item
      ) => {
        const date = new Date(item.date);
        const yearMonth = `${date.getFullYear()}-${date.getMonth()+1}`
        if (!group[yearMonth]) {
          group[yearMonth] = {
            wpm: [],
            percentage: [],
          };
        }
        group[yearMonth]?.wpm?.push(item.wpm);
        group[yearMonth]?.percentage?.push(item.percentage);
        return group;
      },
      {}
    );
    return Object.keys(list).map(key => ({
      date: key,
      [WPM]: average(list[key]?.wpm ?? []),
      [Percentage]: average(list[key]?.percentage ?? []),
    }));
  },
  byDate: (data: Item[]) => {
    const list = data.reduce(
      (
        group: Record<string, { wpm: number[]; percentage: number[] }>,
        item: Item
      ) => {
        const date = new Date(item.date).toDateString();
        if (!group[date]) {
          group[date] = {
            wpm: [],
            percentage: [],
          };
        }
        group[date]?.wpm?.push(item.wpm);
        group[date]?.percentage?.push(item.percentage);
        return group;
      },
      {}
    );
    return Object.keys(list).map(key => ({
      date: key,
      [WPM]: average(list[key]?.wpm ?? []),
      [Percentage]: average(list[key]?.percentage ?? []),
    }));
  },
};

export default function Home() {
  const data = api.example.getAll.useQuery<Item[]>();
  console.log("data.data");
  console.log(data.data);

  return (
    <>
      <Head>
        <title>Analytics</title>
        <meta name="description" content="Typeracer Analytics" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <PerformanceChart
          data={data.data ? dataTransformer.byDate(data.data) : []}
          index="date"
          title="Performance History By Date"
        />
        <PerformanceChart
          data={data.data ? dataTransformer.byMonth(data.data) : []}
          index="date"
          title="Performance History By Month"
        />
        <PerformanceChart
          data={data.data ? dataTransformer.byYear(data.data) : []}
          index="year"
          title="Performance History By Year"
        />
      </main>
    </>
  );
}

type PerformanceChartProps<T> = {
  index: string;
  data: T[];
  title: string;
};

function PerformanceChart<T>({ data, index, title }: PerformanceChartProps<T>) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedKpi = Kpis[selectedIndex] as KPI;

  const areaChartArgs = {
    className: "mt-5 h-72",
    data,
    index,
    categories: [selectedKpi],
    colors: ["blue"] as Color[],
    showLegend: false,
    valueFormatter: formatters[selectedKpi],
    yAxisWidth: 56,
  };

  return (
    <>
      <div className="justify-between md:flex">
        <div>
          <Flex
            className="space-x-0.5"
            justifyContent="start"
            alignItems="center"
          >
            <Title>
              {title}
            </Title>
            <Icon
              icon={InformationCircleIcon}
              variant="simple"
              tooltip="Shows daily increase or decrease of particular domain"
            />
          </Flex>
          <Text> Daily change per domain </Text>
        </div>
        <div>
          <TabGroup index={selectedIndex} onIndexChange={setSelectedIndex}>
            <TabList color="gray" variant="solid">
              <Tab>{WPM}</Tab>
              <Tab>{Percentage}</Tab>
            </TabList>
          </TabGroup>
        </div>
      </div>
      {/* web */}
      <div className="mt-8 hidden w-full sm:block">
        <AreaChart {...areaChartArgs} />
      </div>
      {/* mobile */}
      <div className="mt-8 sm:hidden">
        <AreaChart
          {...areaChartArgs}
          startEndOnly={true}
          showGradient={false}
          showYAxis={false}
        />
      </div>
    </>
  );
}
