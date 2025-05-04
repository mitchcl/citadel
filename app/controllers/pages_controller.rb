class PagesController < ApplicationController
  def home
    read_news_config
  end

  private

  def read_news_config
    config = Rails.configuration.news

    if config['type'] == 'topic'
      read_news_topic_config config
    elsif config['type'] != 'none'
      throw 'Invalid news type: config/news.yml'
    end
  end

  def read_news_topic_config(config)
    limit = config['display'] || 3

    @topic = Forums::Topic.find(config['id'])
    @threads = @topic.threads.visible.ordered.limit(limit)
    @news_posts = @threads.index_with(&:original_post)
    @more_threads = @topic.threads.visible.limit(limit + 1).size > limit
  end
end
