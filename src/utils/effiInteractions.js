function slideUp(el, duration = 200) {
  if (!el) return
  el.style.overflow = 'hidden'
  el.style.transition = `height ${duration}ms ease`
  el.style.height = `${el.scrollHeight}px`
  requestAnimationFrame(() => {
    el.style.height = '0px'
  })
  const onEnd = () => {
    el.style.display = 'none'
    el.style.height = ''
    el.style.overflow = ''
    el.style.transition = ''
    el.removeEventListener('transitionend', onEnd)
  }
  el.addEventListener('transitionend', onEnd)
}

function slideDown(el, duration = 200) {
  if (!el) return
  el.style.display = ''
  const height = el.scrollHeight
  el.style.overflow = 'hidden'
  el.style.height = '0px'
  el.style.transition = `height ${duration}ms ease`
  requestAnimationFrame(() => {
    el.style.height = `${height}px`
  })
  const onEnd = () => {
    el.style.height = ''
    el.style.overflow = ''
    el.style.transition = ''
    el.removeEventListener('transitionend', onEnd)
  }
  el.addEventListener('transitionend', onEnd)
}

function slideToggle(el, duration = 200) {
  if (!el) return
  const hidden = el.offsetParent === null && getComputedStyle(el).display === 'none'
  if (hidden) slideDown(el, duration)
  else slideUp(el, duration)
}

function fadeIn(el, duration = 250, onDone) {
  el.style.display = 'flex'
  el.style.opacity = '0'
  el.style.transition = `opacity ${duration}ms ease`
  requestAnimationFrame(() => {
    el.style.opacity = '1'
  })
  const onEnd = () => {
    el.style.transition = ''
    el.removeEventListener('transitionend', onEnd)
    onDone?.()
  }
  el.addEventListener('transitionend', onEnd)
}

function fadeOut(el, duration = 400, onDone) {
  el.style.transition = `opacity ${duration}ms ease`
  el.style.opacity = '0'
  const onEnd = () => {
    el.style.display = 'none'
    el.style.opacity = ''
    el.style.transition = ''
    el.removeEventListener('transitionend', onEnd)
    onDone?.()
  }
  el.addEventListener('transitionend', onEnd)
}

function initProMenus(root, signal) {
  root.querySelectorAll('.oxy-pro-menu').forEach((menu) => {
    const container = menu.querySelector('.oxy-pro-menu-container')
    if (!container) return

    menu.querySelectorAll('.oxy-pro-menu-show-dropdown .menu-item-has-children > a').forEach((link) => {
      if (!link.querySelector('.oxy-pro-menu-dropdown-icon-click-area')) {
        const area = document.createElement('div')
        area.className = 'oxy-pro-menu-dropdown-icon-click-area'
        area.innerHTML =
          '<svg class="oxy-pro-menu-dropdown-icon"><use xlink:href="#FontAwesomeicon-angle-down"></use></svg>'
        link.appendChild(area)
      }
    })

    menu.querySelectorAll('.oxy-pro-menu-show-dropdown .menu-item:not(.menu-item-has-children) > a').forEach((link) => {
      if (!link.querySelector('.oxy-pro-menu-dropdown-icon-click-area')) {
        const area = document.createElement('div')
        area.className = 'oxy-pro-menu-dropdown-icon-click-area'
        link.appendChild(area)
      }
    })

    setTimeout(() => menu.classList.add('oxy-pro-menu-init'), 10)

    const openIcon = menu.querySelector('.oxy-pro-menu-mobile-open-icon')
    const closeIcon = menu.querySelector('.oxy-pro-menu-mobile-close-icon')

    openIcon?.addEventListener(
      'click',
      () => {
        if (openIcon.classList.contains('oxy-pro-menu-off-canvas-trigger')) {
          toggleOffcanvasMenu(menu, container)
        } else {
          menu.classList.add('oxy-pro-menu-open')
          container.classList.add('oxy-pro-menu-open-container')
          document.body.classList.add('oxy-nav-menu-prevent-overflow')
          document.documentElement.classList.add('oxy-nav-menu-prevent-overflow')
          setProMenuStaticWidth(menu)
        }
        menu.querySelectorAll('.sub-menu').forEach((sub) => {
          sub.setAttribute('data-aos', '')
          sub.style.display = 'none'
        })
      },
      { signal },
    )

    closeIcon?.addEventListener(
      'click',
      (e) => {
        e.stopPropagation()
        menu.classList.remove('oxy-pro-menu-open')
        container.classList.remove('oxy-pro-menu-open-container')
        document.body.classList.remove('oxy-nav-menu-prevent-overflow')
        document.documentElement.classList.remove('oxy-nav-menu-prevent-overflow')
        if (container.classList.contains('oxy-pro-menu-off-canvas-container')) {
          toggleOffcanvasMenu(menu, container)
        }
        unsetProMenuStaticWidth(menu)
      },
      { signal },
    )
  })

  let proMenuMouseDown = false
  document.addEventListener(
    'mousedown',
    (e) => {
      const item = e.target.closest(
        '.oxy-pro-menu-show-dropdown:not(.oxy-pro-menu-open-container) .menu-item-has-children',
      )
      if (item) proMenuMouseDown = true
    },
    { signal },
  )
  document.addEventListener(
    'mouseup',
    () => {
      proMenuMouseDown = false
    },
    { signal },
  )

  root.addEventListener(
    'mouseenter',
    (e) => {
      const item = e.target.closest(
        '.oxy-pro-menu-show-dropdown:not(.oxy-pro-menu-open-container) .menu-item-has-children',
      )
      if (!item || proMenuMouseDown) return
      const subMenu = item.querySelector(':scope > .sub-menu')
      if (!subMenu) return
      subMenu.classList.add('aos-animate', 'oxy-pro-menu-dropdown-animating')
      subMenu.classList.remove('sub-menu-left')
      const menuContainer = item.closest('.oxy-pro-menu-container')
      const duration = parseFloat(menuContainer?.dataset.oxyProMenuDropdownAnimationDuration || '0.4')
      setTimeout(() => subMenu.classList.remove('oxy-pro-menu-dropdown-animating'), duration * 1000)
      const rect = subMenu.getBoundingClientRect()
      if (rect.left + rect.width > window.innerWidth) {
        subMenu.classList.add('sub-menu-left')
      }
    },
    { signal, capture: true },
  )

  root.addEventListener(
    'mouseleave',
    (e) => {
      const item = e.target.closest('.oxy-pro-menu-show-dropdown .menu-item-has-children')
      if (!item) return
      const subMenu = item.querySelector(':scope > .sub-menu')
      subMenu?.classList.remove('aos-animate')
    },
    { signal, capture: true },
  )

  document.addEventListener(
    'click',
    (e) => {
      const area = e.target.closest(
        '.oxy-pro-menu-dropdown-links-toggle.oxy-pro-menu-off-canvas-container .menu-item-has-children > a > .oxy-pro-menu-dropdown-icon-click-area,' +
          '.oxy-pro-menu-dropdown-links-toggle.oxy-pro-menu-open-container .menu-item-has-children > a > .oxy-pro-menu-dropdown-icon-click-area',
      )
      if (!area) return
      e.preventDefault()
      const item = area.closest('.menu-item-has-children')
      const subMenu = item?.querySelector(':scope > .sub-menu')
      if (!subMenu) return
      const menuContainer = area.closest('.oxy-pro-menu-container')
      const duration = parseFloat(menuContainer?.dataset.oxyProMenuDropdownAnimationDuration || '0.4') * 1000
      slideToggle(subMenu, duration)
      subMenu.style.display = subMenu.style.display === 'none' ? 'flex' : subMenu.style.display
    },
    { signal },
  )
}

function setProMenuStaticWidth(menu) {
  const firstItem = menu.querySelector('.oxy-pro-menu-list > .menu-item')
  if (!firstItem) return
  const width = firstItem.getBoundingClientRect().width
  menu.querySelectorAll('.oxy-pro-menu-open-container > div:first-child, .oxy-pro-menu-off-canvas-container > div:first-child').forEach((el) => {
    el.style.width = `${width}px`
  })
}

function unsetProMenuStaticWidth(menu) {
  menu.querySelectorAll('.oxy-pro-menu-container > div:first-child').forEach((el) => {
    el.style.width = ''
  })
}

function toggleOffcanvasMenu(menu, container) {
  container.classList.toggle('aos-animate')
  if (container.classList.contains('oxy-pro-menu-off-canvas-container')) {
    const timeout = parseInt(container.dataset.aosDuration || '0', 10)
    setTimeout(() => {
      container.classList.remove('oxy-pro-menu-off-canvas-container')
      menu.classList.remove('oxy-pro-menu-off-canvas')
    }, timeout || 0)
  } else {
    container.classList.add('oxy-pro-menu-off-canvas-container')
    menu.classList.add('oxy-pro-menu-off-canvas')
    setProMenuStaticWidth(menu)
  }
}

function initStickyHeaders(root, signal) {
  root.querySelectorAll('.oxy-sticky-header').forEach((header) => {
    const scrollval = 900

    const activate = () => {
      if (window.innerWidth < 1121) return
      if (document.body.classList.contains('oxy-nav-menu-prevent-overflow')) return
      if (!header.classList.contains('oxy-sticky-header-active')) {
        if (getComputedStyle(header).position !== 'absolute') {
          document.body.style.marginTop = `${header.offsetHeight}px`
        }
        header.classList.add('oxy-sticky-header-active')
      }
    }

    const deactivate = () => {
      header.classList.remove('oxy-sticky-header-fade-in', 'oxy-sticky-header-active')
      if (getComputedStyle(header).position !== 'absolute') {
        document.body.style.marginTop = ''
      }
    }

    if (!scrollval || scrollval < 1) {
      if (window.innerWidth >= 1121) {
        document.body.style.marginTop = `${header.offsetHeight}px`
        header.classList.add('oxy-sticky-header-active')
      }
      return
    }

    const onScroll = () => {
      if (document.body.classList.contains('oxy-nav-menu-prevent-overflow')) return
      if (window.scrollY > scrollval) activate()
      else deactivate()
    }

    window.addEventListener('scroll', onScroll, { signal, passive: true })
    onScroll()
  })
}

function initModals(root, signal) {
  const showModal = (modal) => {
    if (!modal) return
    modal.classList.add('live')
    const modalEl = modal.querySelector('.ct-modal')
    const modalId = modalEl?.id

    const focusable = modal.querySelector(
      'a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), select:not([disabled])',
    )
    setTimeout(() => (focusable || modal).focus?.(), 500)

    document.body.style.top = `-${window.scrollY}px`
    document.body.classList.add('oxy-modal-active')

    if (modalId && localStorage) {
      localStorage[`oxy-${modalId}-last-shown-time`] = JSON.stringify(Date.now())
    }

    modal.querySelectorAll('.aos-animate').forEach((el) => {
      el.classList.remove('aos-animate')
      el.classList.add('aos-animate-disabled')
    })

    fadeIn(modal, 250, () => {
      modal.querySelectorAll('.aos-animate-disabled').forEach((el) => {
        el.classList.remove('aos-animate-disabled')
        el.classList.add('aos-animate')
      })
    })
  }

  const hideModal = (modal) => {
    const scrollY = document.body.style.top
    document.body.classList.remove('oxy-modal-active')
    document.body.style.top = ''
    window.scrollTo(0, parseInt(scrollY || '0', 10) * -1)

    if (!modal) {
      modal = document.querySelector('.oxy-modal-backdrop.live')
      if (!modal) return
    }

    modal.querySelectorAll('iframe').forEach((iframe) => {
      iframe.src = iframe.src
    })
    modal.querySelectorAll('video').forEach((video) => video.pause())
    modal.querySelectorAll('form').forEach((form) => form.reset())
    modal.querySelectorAll('.aos-animate').forEach((el) => {
      el.classList.remove('aos-animate')
      el.classList.add('aos-animate-disabled')
    })

    fadeOut(modal, 400, () => {
      modal.classList.remove('live')
      modal.querySelectorAll('.aos-animate-disabled').forEach((el) => {
        el.classList.remove('aos-animate-disabled')
        el.classList.add('aos-animate')
      })
    })
  }

  window.oxyShowModal = showModal
  window.oxyCloseModal = hideModal

  root.querySelectorAll('.oxy-modal-backdrop').forEach((modal) => {
    const trigger = modal.dataset.trigger

    if (trigger === 'user_clicks_element') {
      const selector = modal.dataset.triggerSelector
      if (!selector) return
      document.querySelectorAll(selector).forEach((el) => {
        el.addEventListener(
          'click',
          (event) => {
            showModal(modal)
            event.preventDefault()
          },
          { signal },
        )
      })
    }

    if (trigger === 'after_specified_time') {
      let time = parseInt(modal.dataset.triggerTime || '0', 10)
      if (modal.dataset.triggerTimeUnit === 'seconds') {
        time = parseFloat(modal.dataset.triggerTime || '0') * 1000
      }
      setTimeout(() => showModal(modal), time)
    }
  })

  document.addEventListener(
    'click',
    (event) => {
      const target = event.target
      if (target.closest('.oxy-close-modal')) {
        hideModal(target.closest('.oxy-modal-backdrop'))
        return
      }
      if (target.classList?.contains('oxy-modal-backdrop') && target.classList.contains('live')) {
        hideModal(target)
      }
    },
    { signal },
  )

  document.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape') {
        const open = document.querySelector('.oxy-modal-backdrop.live[data-close_on_esc="on"]')
        if (open) hideModal(open)
      }
    },
    { signal },
  )
}

function initSmoothScroll(root, signal) {
  root.addEventListener(
    'click',
    (event) => {
      const anchor = event.target.closest('a[href^="#"]')
      if (!anchor) return
      const id = anchor.getAttribute('href')
      if (!id || id === '#') return
      const target = document.querySelector(id)
      if (!target) return
      event.preventDefault()
      target.scrollIntoView({ behavior: 'smooth' })
    },
    { signal },
  )
}

function initSliders(root) {
  root.querySelectorAll('.ct-slider').forEach((slider) => {
    if (slider.dataset.effiSliderInit) return

    const viewport = slider.querySelector('.oxygen-unslider-container')
    const ul = viewport?.querySelector(':scope > ul')
    if (!ul) return

    const slides = [...ul.children]
    if (slides.length <= 1) return

    slider.dataset.effiSliderInit = 'true'

    const outer = document.createElement('div')
    outer.className = 'unslider'

    const frame = document.createElement('div')
    frame.className = 'unslider-frame'

    viewport.parentNode.insertBefore(outer, viewport)
    outer.appendChild(frame)
    frame.appendChild(viewport)

    viewport.classList.add('unslider-horizontal')
    ul.classList.add('unslider-wrap', 'unslider-carousel')

    let index = 0
    let nav

    const show = (i) => {
      index = Math.max(0, Math.min(slides.length - 1, i))
      ul.style.transform = `translateX(-${index * 100}%)`
      slides.forEach((slide, idx) => {
        slide.classList.toggle('unslider-active', idx === index)
      })
      nav?.querySelectorAll('li').forEach((dot, idx) => {
        dot.classList.toggle('unslider-active', idx === index)
      })
    }

    nav = document.createElement('nav')
    nav.className = 'unslider-nav'
    const ol = document.createElement('ol')
    slides.forEach((_, idx) => {
      const li = document.createElement('li')
      li.dataset.slide = String(idx)
      li.addEventListener('click', () => show(idx))
      ol.appendChild(li)
    })
    nav.appendChild(ol)

    const prev = document.createElement('a')
    prev.className = 'unslider-arrow prev'
    prev.href = '#'
    prev.setAttribute('aria-label', 'Previous slide')
    prev.addEventListener('click', (e) => {
      e.preventDefault()
      show(index - 1)
    })

    const next = document.createElement('a')
    next.className = 'unslider-arrow next'
    next.href = '#'
    next.setAttribute('aria-label', 'Next slide')
    next.addEventListener('click', (e) => {
      e.preventDefault()
      show(index + 1)
    })

    frame.appendChild(prev)
    frame.appendChild(next)
    outer.appendChild(nav)

    show(0)
  })
}

function initToggles(root, signal) {
  root.querySelectorAll('.oxy-toggle').forEach((toggle) => {
    const content = toggle.nextElementSibling
    const expandedClass = toggle.dataset.oxyToggleActiveClass || 'toggle-3045-expanded'
    const initial = toggle.dataset.oxyToggleInitialState || 'closed'
    const icon = toggle.querySelector('.oxy-expand-collapse-icon')

    if (content) {
      if (initial === 'closed') {
        content.style.display = 'none'
        toggle.classList.remove(expandedClass)
        icon?.classList.add('oxy-eci-collapsed')
      } else {
        content.style.display = ''
        toggle.classList.add(expandedClass)
        icon?.classList.remove('oxy-eci-collapsed')
      }
    }

    toggle.addEventListener(
      'click',
      (e) => {
        e.stopPropagation()
        const parent = toggle.closest('.ct-div-block')?.parentElement
        const allToggles = parent ? parent.querySelectorAll('.oxy-toggle') : [toggle]

        allToggles.forEach((other) => {
          if (other === toggle) return
          const otherContent = other.nextElementSibling
          const otherClass = other.dataset.oxyToggleActiveClass || expandedClass
          if (otherContent) slideUp(otherContent)
          other.classList.remove(otherClass)
          other.querySelector('.oxy-expand-collapse-icon')?.classList.add('oxy-eci-collapsed')
        })

        if (content) slideToggle(content)
        icon?.classList.toggle('oxy-eci-collapsed')
        toggle.classList.toggle(expandedClass)
      },
      { signal },
    )
  })
}

function initPhoneInputs(root) {
  if (!window.intlTelInput) return
  root.querySelectorAll('input.ff-el-phone, input[type="tel"].ff-el-form-control').forEach((input) => {
    if (input.dataset.itiInitialized) return
    try {
      window.intlTelInput(input, {
        initialCountry: 'au',
        separateDialCode: true,
        utilsScript: undefined,
      })
      input.dataset.itiInitialized = 'true'
    } catch {
      // intlTelInputWithUtils bundle includes utils
      try {
        window.intlTelInput(input, { initialCountry: 'au', separateDialCode: true })
        input.dataset.itiInitialized = 'true'
      } catch {
        // ignore
      }
    }
  })
}

function initAos() {
  document.body.classList.add('oxygen-aos-enabled')
  if (window.AOS && typeof window.AOS.init === 'function') {
    if (!window.AOS._effiInit) {
      window.AOS.init({ duration: 1500, type: 'fade-up' })
      window.AOS._effiInit = true
    } else if (typeof window.AOS.refresh === 'function') {
      window.AOS.refresh()
    }
  }
}

const cleanups = new WeakMap()

export function initEffiInteractions(root = document) {
  destroyEffiInteractions(root)

  const controller = new AbortController()
  const { signal } = controller

  initProMenus(root, signal)
  initStickyHeaders(root, signal)
  initModals(root, signal)
  initSmoothScroll(root, signal)
  initSliders(root)
  initToggles(root, signal)
  initPhoneInputs(root)
  initAos()

  cleanups.set(root, () => {
    controller.abort()
    root.querySelectorAll('.ct-slider').forEach((slider) => {
      delete slider.dataset.effiSliderInit
    })
  })
}

export function destroyEffiInteractions(root = document) {
  const cleanup = cleanups.get(root)
  if (cleanup) {
    cleanup()
    cleanups.delete(root)
  }
}
