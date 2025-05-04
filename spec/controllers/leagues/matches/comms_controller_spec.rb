require 'rails_helper'

describe Leagues::Matches::CommsController do
  let(:user) { create(:user) }
  let(:match) { create(:league_match) }
  let(:league) { match.league }
  let(:content) { 'ABCDEFGHIJKLMNOP' }

  describe 'POST #create' do
    it 'succeeds for authorized user' do
      user.grant(:edit, match.home_team.team)
      sign_in user

      post :create, params: {
        league_id: league.id, match_id: match.id, comm: { content: }
      }

      comm = match.comms.first
      expect(comm).to_not be nil
      expect(comm.match).to eq(match)
      expect(comm.content).to eq(content)
      expect(response).to redirect_to(comm.paths.show)
    end

    it 'fails with invalid data' do
      user.grant(:edit, match.home_team.team)
      sign_in user

      post :create, params: {
        league_id: league.id, match_id: match.id, comm: { content: nil }
      }

      expect(match.comms).to be_empty
      expect(response).to have_http_status(:success)
    end

    it 'redirects for banned user for leagues' do
      user.grant(:edit, match.home_team.team)
      user.ban(:use, :leagues)
      sign_in user

      post :create, params: {
        league_id: league.id, match_id: match.id, comm: { content: }
      }

      expect(match.comms).to be_empty
      expect(response).to redirect_to(match_path(match))
    end

    it 'redirects for banned user for teams' do
      user.grant(:edit, match.home_team.team)
      user.ban(:use, :teams)
      sign_in user

      post :create, params: {
        league_id: league.id, match_id: match.id, comm: { content: }
      }

      expect(match.comms).to be_empty
      expect(response).to redirect_to(match_path(match))
    end

    it 'redirects for unauthorized user' do
      sign_in user

      post :create, params: {
        league_id: league.id, match_id: match.id, comm: { content: }
      }

      expect(match.comms).to be_empty
      expect(response).to redirect_to(match_path(match))
    end

    it 'redirects for unauthenticated user' do
      post :create, params: {
        league_id: league.id, match_id: match.id, comm: { content: }
      }

      expect(match.comms).to be_empty
      expect(response).to redirect_to(match_path(match))
    end
  end

  context 'existing comm' do
    let(:writer) { create(:user) }
    let(:comm) { create(:league_match_comm, match:, created_by: writer) }

    describe 'GET #edit' do
      it 'succeeds for authorized user' do
        user.grant(:edit, league)
        sign_in user

        get :edit, params: { id: comm.id }

        expect(response).to have_http_status(:success)
      end

      it 'succeeds for writer' do
        sign_in writer

        get :edit, params: { id: comm.id }

        expect(response).to have_http_status(:success)
      end

      it 'redirects for any captain' do
        user.grant(:edit, match.home_team.team)
        sign_in user

        get :edit, params: { id: comm.id }

        expect(response).to redirect_to(comm.paths.show)
      end
    end

    describe 'PATCH #update' do
      it 'succeeds for authorized admin' do
        user.grant(:edit, league)
        sign_in user

        patch :update, params: { id: comm.id, comm: { content: } }

        comm.reload
        expect(comm.content).to eq(content)
        expect(comm.created_by).to eq(writer)
        edit = comm.edits.first
        expect(edit.created_by).to eq(user)
        expect(response).to redirect_to(comm.paths.show)
      end

      it 'succeeds for writer' do
        sign_in writer

        patch :update, params: { id: comm.id, comm: { content: } }

        expect(comm.reload.content).to eq(content)
        expect(response).to redirect_to(comm.paths.show)
      end

      it 'fails for invalid data' do
        sign_in writer

        patch :update, params: { id: comm.id, comm: { content: nil } }

        expect(comm.reload.content).to_not eq(content)
        expect(response).to have_http_status(:success)
      end

      it 'redirects for any captain' do
        user.grant(:edit, match.home_team.team)
        sign_in user

        patch :update, params: { id: comm.id, comm: { content: } }

        expect(comm.reload.content).to_not eq(content)
        expect(response).to redirect_to(comm.paths.show)
      end

      it 'redirects for banned user for leagues' do
        writer.ban(:use, :leagues)
        sign_in writer

        patch :update, params: { id: comm.id, comm: { content: } }

        expect(comm.reload.content).to_not eq(content)
        expect(response).to redirect_to(comm.paths.show)
      end

      it 'redirects for banned user for teams' do
        writer.ban(:use, :teams)
        sign_in writer

        patch :update, params: { id: comm.id, comm: { content: } }

        expect(comm.reload.content).to_not eq(content)
        expect(response).to redirect_to(comm.paths.show)
      end

      it 'redirects for any user' do
        sign_in user

        patch :update, params: { id: comm.id, comm: { content: } }

        expect(comm.reload.content).to_not eq(content)
        expect(response).to redirect_to(comm.paths.show)
      end

      it 'redirects for unauthenticated user' do
        patch :update, params: { id: comm.id, comm: { content: } }

        expect(comm.reload.content).to_not eq(content)
        expect(response).to redirect_to(comm.paths.show)
      end
    end

    describe 'GET #edits' do
      let!(:edits) { create_list(:league_match_comm_edit, 3, comm:, created_by: writer) }

      it 'succeeds for authorized user' do
        user.grant(:edit, league)
        sign_in user

        get :edits, params: { id: comm.id }

        expect(response).to have_http_status(:success)
      end

      it 'succeeds for writer' do
        sign_in writer

        get :edits, params: { id: comm.id }

        expect(response).to have_http_status(:success)
      end

      it 'redirects for any captain' do
        user.grant(:edit, match.home_team.team)
        sign_in user

        get :edits, params: { id: comm.id }

        expect(response).to redirect_to(comm.paths.show)
      end
    end

    describe 'DELETE #destroy' do
      it 'succeeds for authorized admin' do
        user.grant(:edit, league)
        sign_in user

        delete :destroy, params: { id: comm.id }

        expect(comm.reload.exists?).to be false
        expect(response).to redirect_to(comm.paths.show)
      end

      it 'redirects for writer' do
        sign_in writer

        delete :destroy, params: { id: comm.id }

        expect(comm.reload.exists?).to be true
        expect(response).to redirect_to(match_path(match))
      end

      it 'redirects for any captain' do
        user.grant(:edit, match.home_team.team)
        sign_in user

        delete :destroy, params: { id: comm.id }

        expect(comm.reload.exists?).to be true
        expect(response).to redirect_to(match_path(match))
      end

      it 'redirects for any user' do
        sign_in user

        delete :destroy, params: { id: comm.id }

        expect(comm.reload.exists?).to be true
        expect(response).to redirect_to(match_path(match))
      end

      it 'redirects for unauthenticated user' do
        delete :destroy, params: { id: comm.id }

        expect(comm.reload.exists?).to be true
        expect(response).to redirect_to(match_path(match))
      end
    end

    describe '#restore' do
      it 'redirects for authorized user' do
        user.grant(:edit, league)
        sign_in user

        patch :restore, params: { id: comm.id }

        expect(comm.reload.exists?).to be true
        expect(response).to redirect_to(match_path(match))
      end
    end
  end

  context 'deleted comm' do
    let(:writer) { create(:user) }
    let(:comm) { create(:league_match_comm, match:, created_by: writer, deleted_by: writer) }

    describe '#update' do
      it 'redirects for authorized admin' do
        user.grant(:edit, league)
        sign_in user

        patch :update, params: { id: comm.id, comm: { content: } }

        comm.reload
        expect(comm.exists?).to be false
        expect(comm.content).to_not eq(content)
        expect(response).to redirect_to(match_path(match))
      end
    end

    describe '#destroy' do
      it 'redirects for authorized user' do
        user.grant(:edit, league)
        sign_in user

        delete :destroy, params: { id: comm.id }

        expect(comm.reload.exists?).to be false
        expect(response).to redirect_to(match_path(match))
      end
    end

    describe '#restore' do
      it 'succeeds for authorized user' do
        user.grant(:edit, league)
        sign_in user

        patch :restore, params: { id: comm.id }

        expect(comm.reload.exists?).to be true
        expect(response).to redirect_to(comm.paths.show)
      end

      it 'redirects for writer' do
        sign_in writer

        patch :restore, params: { id: comm.id }

        expect(comm.reload.exists?).to be false
        expect(response).to redirect_to(match_path(match))
      end

      it 'redirects for any captain' do
        user.grant(:edit, match.home_team.team)
        sign_in user

        patch :restore, params: { id: comm.id }

        expect(comm.reload.exists?).to be false
        expect(response).to redirect_to(match_path(match))
      end
    end
  end
end
