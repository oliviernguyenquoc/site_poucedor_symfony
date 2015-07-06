<?php
// src/Acme/MainBundle/Menu/MenuBuilder.php

namespace Pouce\SiteBundle\Menu;

use Knp\Menu\FactoryInterface;
use Symfony\Component\HttpFoundation\Request;

class MenuBuilder
{
    private $factory;

    /**
     * @param FactoryInterface $factory
     */
    public function __construct(FactoryInterface $factory)
    {
        $this->factory = $factory;
    }

    public function createMainMenu(Request $request)
    {
        $menu = $this->factory->createItem('root');
        $menu->setChildrenAttribute('class', 'right hide-on-med-and-down');
        $menu->addChild('Home', array('route' => 'pouce_site_homepage'));
        $menu->addChild('Regle', array('route' => 'pouce_site_regles'));

        return $menu;
    }

    public function createMobileMenu(Request $request)
    {
        $menu = $this->factory->createItem('root');
        $menu->setChildrenAttribute('id', 'nav-mobile');
        $menu->setChildrenAttribute('class', 'side-nav');
        $menu->addChild('Home', array('route' => 'pouce_site_homepage'));
        $menu->addChild('Regle', array('route' => 'pouce_site_regles'));

        return $menu;
    }
}