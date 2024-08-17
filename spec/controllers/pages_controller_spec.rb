require 'rails_helper'

describe PagesController do
  describe 'GET #home' do
    after do
      Rails.configuration.news['type'] = 'none'
    end

    context 'news: none' do
      it 'returns http success' do
        Rails.configuration.news['type'] = 'none'

        get :home

        expect(response).to have_http_status(:success)
      end
    end

    context 'news: topic' do
      it 'returns http success' do
        Rails.configuration.news['type'] = 'topic'
        Rails.configuration.news['id'] = create(:forums_topic).id

        get :home

        expect(response).to have_http_status(:success)
      end

      it 'hides hidden threads' do
        topic = create(:forums_topic)
        thread = create(:forums_thread, topic: topic)
        create(:forums_thread, topic: topic, hidden: true)

        Rails.configuration.news['type'] = 'topic'
        Rails.configuration.news['id'] = topic.id

        get :home

        expect(response).to have_http_status(:success)
        expect(controller.view_assigns['threads']).to eq([thread])
      end
    end

    context 'invalid news config' do
      it 'raises internal error' do
        Rails.configuration.news['type'] = nil

        expect { get :home }.to raise_error(UncaughtThrowError)
      end
    end
  end
end
