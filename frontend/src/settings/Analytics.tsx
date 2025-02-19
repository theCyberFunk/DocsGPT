import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

import userService from '../api/services/userService';
import Dropdown from '../components/Dropdown';
import { htmlLegendPlugin } from '../utils/chartUtils';
import { formatDate } from '../utils/dateTimeUtils';
import { APIKeyData } from './types';
import { useLoaderState } from '../hooks';

import type { ChartData } from 'chart.js';
import SkeletonLoader from '../components/SkeletonLoader';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

export default function Analytics() {
  const { t } = useTranslation();

  const filterOptions = [
    { label: t('settings.analytics.filterOptions.hour'), value: 'last_hour' },
    {
      label: t('settings.analytics.filterOptions.last24Hours'),
      value: 'last_24_hour',
    },
    {
      label: t('settings.analytics.filterOptions.last7Days'),
      value: 'last_7_days',
    },
    {
      label: t('settings.analytics.filterOptions.last15Days'),
      value: 'last_15_days',
    },
    {
      label: t('settings.analytics.filterOptions.last30Days'),
      value: 'last_30_days',
    },
  ];

  const [messagesData, setMessagesData] = useState<Record<
    string,
    number
  > | null>(null);
  const [tokenUsageData, setTokenUsageData] = useState<Record<
    string,
    number
  > | null>(null);
  const [feedbackData, setFeedbackData] = useState<Record<
    string,
    { positive: number; negative: number }
  > | null>(null);
  const [chatbots, setChatbots] = useState<APIKeyData[]>([]);
  const [selectedChatbot, setSelectedChatbot] = useState<APIKeyData | null>();
  const [messagesFilter, setMessagesFilter] = useState<{
    label: string;
    value: string;
  }>({
    label: t('settings.analytics.filterOptions.last30Days'),
    value: 'last_30_days',
  });
  const [tokenUsageFilter, setTokenUsageFilter] = useState<{
    label: string;
    value: string;
  }>({
    label: t('settings.analytics.filterOptions.last30Days'),
    value: 'last_30_days',
  });
  const [feedbackFilter, setFeedbackFilter] = useState<{
    label: string;
    value: string;
  }>({
    label: t('settings.analytics.filterOptions.last30Days'),
    value: 'last_30_days',
  });

  const [loadingMessages, setLoadingMessages] = useLoaderState(true);
  const [loadingTokens, setLoadingTokens] = useLoaderState(true);
  const [loadingFeedback, setLoadingFeedback] = useLoaderState(true);
  const [loadingChatbots, setLoadingChatbots] = useLoaderState(true);

  const fetchChatbots = async () => {
    setLoadingChatbots(true);
    try {
      const response = await userService.getAPIKeys();
      if (!response.ok) {
        throw new Error('Failed to fetch Chatbots');
      }
      const chatbots = await response.json();
      setChatbots(chatbots);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingChatbots(false);
    }
  };

  const fetchMessagesData = async (chatbot_id?: string, filter?: string) => {
    setLoadingMessages(true);
    try {
      const response = await userService.getMessageAnalytics({
        api_key_id: chatbot_id,
        filter_option: filter,
      });
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      const data = await response.json();
      setMessagesData(data.messages);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const fetchTokenData = async (chatbot_id?: string, filter?: string) => {
    setLoadingTokens(true);
    try {
      const response = await userService.getTokenAnalytics({
        api_key_id: chatbot_id,
        filter_option: filter,
      });
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      const data = await response.json();
      setTokenUsageData(data.token_usage);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingTokens(false);
    }
  };

  const fetchFeedbackData = async (chatbot_id?: string, filter?: string) => {
    setLoadingFeedback(true);
    try {
      const response = await userService.getFeedbackAnalytics({
        api_key_id: chatbot_id,
        filter_option: filter,
      });
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      const data = await response.json();
      setFeedbackData(data.feedback);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingFeedback(false);
    }
  };

  useEffect(() => {
    fetchChatbots();
  }, []);

  useEffect(() => {
    const id = selectedChatbot?.id;
    const filter = messagesFilter;
    fetchMessagesData(id, filter?.value);
  }, [selectedChatbot, messagesFilter]);

  useEffect(() => {
    const id = selectedChatbot?.id;
    const filter = tokenUsageFilter;
    fetchTokenData(id, filter?.value);
  }, [selectedChatbot, tokenUsageFilter]);

  useEffect(() => {
    const id = selectedChatbot?.id;
    const filter = feedbackFilter;
    fetchFeedbackData(id, filter?.value);
  }, [selectedChatbot, feedbackFilter]);

  return (
    <div className="mt-12">
      <div className="flex flex-col items-start">
        <div className="flex flex-col gap-3">
          <p className="font-bold text-jet dark:text-bright-gray">
            {t('settings.analytics.filterByChatbot')}
          </p>
          <Dropdown
            size="w-[55vw] sm:w-[360px]"
            options={[
              ...chatbots.map((chatbot) => ({
                label: chatbot.name,
                value: chatbot.id,
              })),
              { label: t('settings.analytics.none'), value: '' },
            ]}
            placeholder={t('settings.analytics.selectChatbot')}
            onSelect={(chatbot: { label: string; value: string }) => {
              setSelectedChatbot(
                chatbots.find((item) => item.id === chatbot.value),
              );
            }}
            selectedValue={
              (selectedChatbot && {
                label: selectedChatbot.name,
                value: selectedChatbot.id,
              }) ||
              null
            }
            rounded="3xl"
            border="border"
          />
        </div>

        {/* Messages Analytics */}
        <div className="mt-8 w-full flex flex-col [@media(min-width:1080px)]:flex-row gap-3">
          <div className="h-[345px] [@media(min-width:1080px)]:w-1/2 w-full px-6 py-5 border rounded-2xl border-silver dark:border-silver/40 overflow-hidden">
            <div className="flex flex-row items-center justify-start gap-3">
              <p className="font-bold text-jet dark:text-bright-gray">
                {t('settings.analytics.messages')}
              </p>
              <Dropdown
                size="w-[125px]"
                options={filterOptions}
                placeholder={t('settings.analytics.filterPlaceholder')}
                onSelect={(selectedOption: {
                  label: string;
                  value: string;
                }) => {
                  setMessagesFilter(selectedOption);
                }}
                selectedValue={messagesFilter ?? null}
                rounded="3xl"
                border="border"
                contentSize="text-sm"
              />
            </div>
            <div className="mt-px relative h-[245px] w-full">
              <div
                id="legend-container-1"
                className="flex flex-row items-center justify-end"
              ></div>
              {loadingMessages ? (
                <SkeletonLoader count={1} component={'analysis'} />
              ) : (
                <AnalyticsChart
                  data={{
                    labels: Object.keys(messagesData || {}).map((item) =>
                      formatDate(item),
                    ),
                    datasets: [
                      {
                        label: t('settings.analytics.messages'),
                        data: Object.values(messagesData || {}),
                        backgroundColor: '#7D54D1',
                      },
                    ],
                  }}
                  legendID="legend-container-1"
                  maxTicksLimitInX={8}
                  isStacked={false}
                />
              )}
            </div>
          </div>

          {/* Token Usage Analytics */}
          <div className="h-[345px] [@media(min-width:1080px)]:w-1/2 w-full px-6 py-5 border rounded-2xl border-silver dark:border-silver/40 overflow-hidden">
            <div className="flex flex-row items-center justify-start gap-3">
              <p className="font-bold text-jet dark:text-bright-gray">
                {t('settings.analytics.tokenUsage')}
              </p>
              <Dropdown
                size="w-[125px]"
                options={filterOptions}
                placeholder={t('settings.analytics.filterPlaceholder')}
                onSelect={(selectedOption: {
                  label: string;
                  value: string;
                }) => {
                  setTokenUsageFilter(selectedOption);
                }}
                selectedValue={tokenUsageFilter ?? null}
                rounded="3xl"
                border="border"
                contentSize="text-sm"
              />
            </div>
            <div className="mt-px relative h-[245px] w-full">
              <div
                id="legend-container-2"
                className="flex flex-row items-center justify-end"
              ></div>
              {loadingTokens ? (
                <SkeletonLoader count={1} component={'analysis'} />
              ) : (
                <AnalyticsChart
                  data={{
                    labels: Object.keys(tokenUsageData || {}).map((item) =>
                      formatDate(item),
                    ),
                    datasets: [
                      {
                        label: t('settings.analytics.tokenUsage'),
                        data: Object.values(tokenUsageData || {}),
                        backgroundColor: '#7D54D1',
                      },
                    ],
                  }}
                  legendID="legend-container-2"
                  maxTicksLimitInX={8}
                  isStacked={false}
                />
              )}
            </div>
          </div>
        </div>

        {/* Feedback Analytics */}
        <div className="mt-8 w-full flex flex-col gap-3">
          <div className="h-[345px] w-full px-6 py-5 border rounded-2xl border-silver dark:border-silver/40 overflow-hidden">
            <div className="flex flex-row items-center justify-start gap-3">
              <p className="font-bold text-jet dark:text-bright-gray">
                {t('settings.analytics.feedback')}
              </p>
              <Dropdown
                size="w-[125px]"
                options={filterOptions}
                placeholder={t('settings.analytics.filterPlaceholder')}
                onSelect={(selectedOption: {
                  label: string;
                  value: string;
                }) => {
                  setFeedbackFilter(selectedOption);
                }}
                selectedValue={feedbackFilter ?? null}
                rounded="3xl"
                border="border"
                contentSize="text-sm"
              />
            </div>
            <div className="mt-px relative h-[245px] w-full">
              <div
                id="legend-container-3"
                className="flex flex-row items-center justify-end"
              ></div>
              {loadingFeedback ? (
                <SkeletonLoader count={1} component={'analysis'} />
              ) : (
                <AnalyticsChart
                  data={{
                    labels: Object.keys(feedbackData || {}).map((item) =>
                      formatDate(item),
                    ),
                    datasets: [
                      {
                        label: t('settings.analytics.positiveFeedback'),
                        data: Object.values(feedbackData || {}).map(
                          (item) => item.positive,
                        ),
                        backgroundColor: '#7D54D1',
                      },
                      {
                        label: t('settings.analytics.negativeFeedback'),
                        data: Object.values(feedbackData || {}).map(
                          (item) => item.negative,
                        ),
                        backgroundColor: '#FF6384',
                      },
                    ],
                  }}
                  legendID="legend-container-3"
                  maxTicksLimitInX={8}
                  isStacked={false}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type AnalyticsChartProps = {
  data: ChartData<'bar'>;
  legendID: string;
  maxTicksLimitInX: number;
  isStacked: boolean;
};

function AnalyticsChart({
  data,
  legendID,
  maxTicksLimitInX,
  isStacked,
}: AnalyticsChartProps) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      htmlLegend: {
        containerID: legendID,
      },
    },
    scales: {
      x: {
        grid: {
          lineWidth: 0.2,
          color: '#C4C4C4',
        },
        border: {
          width: 0.2,
          color: '#C4C4C4',
        },
        ticks: {
          maxTicksLimit: maxTicksLimitInX,
        },
        stacked: isStacked,
      },
      y: {
        grid: {
          lineWidth: 0.2,
          color: '#C4C4C4',
        },
        border: {
          width: 0.2,
          color: '#C4C4C4',
        },
        stacked: isStacked,
      },
    },
  };
  return <Bar options={options} plugins={[htmlLegendPlugin]} data={data} />;
}
