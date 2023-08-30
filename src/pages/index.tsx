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
  Metric,
} from "@tremor/react";
import { api } from "~/utils/api";
import { useState } from "react";
import { DataType } from "~/server/types";

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

const dataTransformer = {
  byYear: (data: DataType[]) => {
    const years = data.reduce(
      (
        group: Record<number, { wpm: number[]; percentage: number[] }>,
        item: DataType
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
  byMonth: (data: DataType[]) => {
    const list = data.reduce(
      (
        group: Record<string, { wpm: number[]; percentage: number[] }>,
        item: DataType
      ) => {
        const date = new Date(item.date);
        const yearMonth = `${date.getFullYear()}-${date.getMonth() + 1}`;
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
    return Object.keys(list)
      .map((key) => ({
        date: key,
        [WPM]: average(list[key]?.wpm ?? []),
        [Percentage]: average(list[key]?.percentage ?? []),
      }))
      .reverse();
  },
  byDate: (data: DataType[]) => {
    const list = data.reduce(
      (
        group: Record<string, { wpm: number[]; percentage: number[] }>,
        item: DataType
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
    return Object.keys(list)
      .map((key) => ({
        date: key,
        [WPM]: average(list[key]?.wpm ?? []),
        [Percentage]: average(list[key]?.percentage ?? []),
      }))
      .reverse();
  },
  groupByNumber: (data: DataType[], num: number) => {
    let temp: DataType[] = [];
    const list: Record<string, { wpm: number[]; percentage: number[] }> = {};
    for (let i = 0; i < data.length; i++) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      temp.push(data[i]);
      if (i !== 0 && i % num == 0) {
        // TODO shit broke returns 4-34 sometimes and sometimes 306-325
        list[`${data[i]?.raceNumber}-${data[i-num]?.raceNumber}-${i}-${i-num}`] = {
          wpm: temp.map((item: DataType) => item.wpm),
          percentage: temp.map((item: DataType) => item.percentage),
        };
        temp = [];
      }
    }
    return Object.keys(list)
      .map((key) => ({
        date: key,
        [WPM]: average(list[key]?.wpm ?? []),
        [Percentage]: average(list[key]?.percentage ?? []),
      }))
      .reverse();
  },
};

export default function Home() {
  const data = api.example.getAll.useQuery<DataType[]>();
  const createUserData = api.example.createUserData.useMutation({onSuccess:() => data.refetch()});
  console.log(createUserData.status);
  console.log(createUserData.data);

  return (
    <>
      <Head>
        <title>Analytics</title>
        <meta name="description" content="Typeracer Analytics" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="grid min-h-screen grid-cols-2 items-center gap-4 bg-gradient-to-b from-[#2e026d] to-[#15162c] p-4">
        <div className="grid grid-cols-2 items-center gap-3">
          <button
            className="rounded-lg bg-indigo-500 text-white"
            onClick={() => {
              console.log("on click");
              createUserData.mutate({ username: "ferealqq" });
            }}
          >
            Fetch data
          </button>
          <button
            className="rounded-lg bg-indigo-500 text-white"
            onClick={() => {
              console.log("on click");
              // mutation.mutate({username: "ferealqq"})
            }}
          >
            Refresh
          </button>
          <GeneralPerformance data={data.isSuccess ? data.data : []} />
        </div>
        <PerformanceChart
          data={
            data.isSuccess ? dataTransformer.groupByNumber(data.data, 30) : []
          }
          index="date"
          title="Performance History By 50"
        />
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

type GeneralPerformanceProps = {
  data: DataType[];
};

const GeneralPerformance = ({ data }: GeneralPerformanceProps) => {
  const wpm = average(data.map((item) => item.wpm)).toFixed(2);
  const percentage = average(data.map((item) => item.percentage)).toFixed(2);
  return (
    <>
      <Card
        className="mx-auto max-w-xs"
        decoration="top"
        decorationColor="indigo"
      >
        <Text>{WPM}</Text>
        <Metric>{wpm}</Metric>
      </Card>
      <Card
        className="mx-auto max-w-xs"
        decoration="top"
        decorationColor="indigo"
      >
        <Text>{Percentage}</Text>
        <Metric>{percentage}%</Metric>
      </Card>
    </>
  );
};

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
    <div>
      <div className="justify-between md:flex">
        <div>
          <Flex
            className="space-x-0.5"
            justifyContent="start"
            alignItems="center"
          >
            <Title>{title}</Title>
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
    </div>
  );
}
