require 'rails_helper'

describe 'leagues/rosters/new' do
  let(:team) { create(:team) }
  let(:team2) { create(:team) }
  let(:league) { create(:league) }
  let(:div) { create(:league_division, league:) }
  let(:captain) { create(:user) }

  before do
    captain.grant(:edit, team)
    captain.grant(:edit, team2)
  end

  it 'displays form' do
    sign_in captain
    assign(:league, league)
    assign(:roster, league.rosters.new)
    assign(:teams, [team, team2])

    render
  end

  describe 'selected team' do
    let(:roster) { create(:league_roster, team:, division: div) }

    before do
      team.users << roster.players[0].user
    end

    it 'displays form' do
      sign_in captain
      assign(:league, league)
      assign(:roster, roster)
      assign(:team, team)

      render
    end

    it 'displays errors' do
      sign_in captain
      roster.players[0].errors.add(:base, 'Can only be in one roster per league')
      assign(:roster, roster)
      assign(:league, league)
      assign(:team, team)

      render

      expect(rendered).to include('Can only be in one roster per league')
    end
  end
end
