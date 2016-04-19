<?php

namespace Pouce\OAuthServerBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use FOS\OAuthServerBundle\Entity\Client as BaseClient; 

/**
 * Client
 *
 * @ORM\Table()
 * @ORM\Entity
 */
class Client extends BaseClient  
{
    /**
     * @var integer
     *
     * @ORM\Column(name="id", type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    protected $id;

}
