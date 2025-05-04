module ApplicationHelper
  include ApplicationPermissions

  def navbar_class(name)
    if navbar_active?(name)
      'active'
    else
      ''
    end
  end

  def navbar_active?(name)
    case name
    when :admin
      controller.is_a? AdminController
    else
      controller_path.start_with?(name.to_s) ||
        (controller_name == 'pages' && action_name == name.to_s)
    end
  end

  def format_options
    Format.all.collect { |format| [format.name, format.id] }
  end

  def divisions_select(league)
    league.divisions.all.collect { |div| [div.name, div.id] }
  end

  def bootstrap_paginate(target, options = {})
    will_paginate target, { renderer: WillPaginate::ActionView::BootstrapLinkRenderer,
                            outer_window: 1, inner_window: 1 }.merge(options)
  end

  def present(object, klass = nil)
    klass ||= BasePresenter.presenter object

    klass.new(object, self)
  end

  def present_collection(collection, klass = nil)
    collection.map { |object| present(object, klass) }
  end
end
